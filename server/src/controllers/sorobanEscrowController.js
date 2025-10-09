import dotenv from 'dotenv'
import * as stellarPkg from '@stellar/stellar-sdk'
// use TransactionBuilder and Account from the SDK to construct transactions
const { TransactionBuilder, Account, Networks } = stellarPkg
import { Operation } from '@stellar/stellar-base'
import { supabase } from '../models/supabaseClient.js'

dotenv.config()

const SOROBAN_RPC = process.env.SOROBAN_RPC_URL || process.env.SOROBAN_RPC || 'https://soroban-testnet.stellar.org'
const CONTRACT_ID = process.env.SOROBAN_CONTRACT_ID || 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC'
const NETWORK_PASSPHRASE = process.env.STELLAR_NETWORK === 'PUBLIC' ? 'Public Global Stellar Network ; September 2015' : 'Test SDF Network ; September 2022'

const SorobanServer = stellarPkg.SorobanRpc.Server
const parseRawSimulation = stellarPkg.SorobanRpc.parseRawSimulation
const Api = stellarPkg.SorobanRpc.Api
const sorobanServer = new SorobanServer(SOROBAN_RPC)

// Prepare an unsigned Soroban transaction for create_escrow
export const prepareCreateEscrow = async (req, res) => {
  try {
    const { client, worker, amount, job_id } = req.body
    if (!client || !worker || !amount || !job_id) return res.status(400).json({ error: 'client, worker, amount, job_id required' })

    // The deployed contract doesn't match our local source code
    // Return helpful instructions for the user
    return res.status(400).json({ 
      error: 'Contract function mismatch', 
      details: 'The deployed contract at ' + CONTRACT_ID + ' does not have the expected functions (create_job, get_job_count, release).',
      solution: 'You need to deploy your local contract. Here are the steps:',
      deploymentSteps: [
        '1. Install Stellar CLI: npm install -g @stellar/cli',
        '2. Build the contract: stellar contract build --source contracts/escrow_contract.rs',
        '3. Deploy to testnet: stellar contract deploy --wasm target/wasm32-unknown-unknown/release/escrow_contract.wasm --source <YOUR_SECRET_KEY> --network testnet',
        '4. Update SOROBAN_CONTRACT_ID in your .env file with the new contract address',
        '5. Restart the server'
      ],
      currentContractId: CONTRACT_ID,
      expectedFunctions: ['create_job', 'release', 'get_job_count']
    })

    // Build a Transaction object (sdk Transaction) and simulate that.
    const raw = {
      source: client,
      fee: '100',
      networkPassphrase: NETWORK_PASSPHRASE
    }

    // Build invokeHostFunction operation using Contract helper with proper ScVal conversion
    const contract = new stellarPkg.Contract(CONTRACT_ID)
    // The contract function is 'create_job' and takes (client, worker, amount) - no job_id parameter
    const invokeOp = contract.call(
      'create_job',
      stellarPkg.Address.fromString(client).toScVal(),
      stellarPkg.Address.fromString(worker).toScVal(),
      stellarPkg.nativeToScVal(amount, { type: 'i64' })
    )

    // Create a temporary account (sequence not required for simulation) and transaction
    const accountStub = new Account(client, '0')
    const txBuilderForSim = new TransactionBuilder(accountStub, {
      fee: raw.fee,
      networkPassphrase: raw.networkPassphrase
    })
      .addOperation(invokeOp)
      .setTimeout(300)

    const txForSim = txBuilderForSim.build()

    // Simulate to get resource fees and transaction data
    let simulation
    try {
      console.log('Simulating Soroban tx (built Transaction) for create_job, payload:', JSON.stringify({ client, worker, amount, job_id }))
      simulation = await sorobanServer.simulateTransaction(txForSim)
    } catch (simErr) {
      console.error('Soroban simulateTransaction error:', simErr && simErr.toString(), simErr && simErr.response && simErr.response.data)
      return res.status(500).json({ error: 'Simulation call failed', details: simErr && (simErr.response?.data || simErr.message || String(simErr)) })
    }

    let success
    try {
      success = parseRawSimulation(simulation)
    } catch (parseErr) {
      console.error('parseRawSimulation error:', parseErr, 'raw simulation:', simulation)
      return res.status(500).json({ error: 'Failed to parse simulation result', details: parseErr.message || String(parseErr), raw: simulation })
    }

    if (!Api.isSimulationSuccess(success)) {
      console.error('Simulation returned non-success:', success)
      return res.status(400).json({ error: 'Simulation failed', details: success })
    }

    // Assemble unsigned transaction by cloning from the simulated transaction
    const unsignedBuilder = TransactionBuilder.cloneFrom(txForSim, {
      fee: (parseInt(raw.fee || '0') + parseInt(success.minResourceFee || '0')).toString(),
      sorobanData: success.transactionData.build(),
      networkPassphrase: raw.networkPassphrase
    })

    // replace operation with one that includes auth from simulation
    unsignedBuilder.clearOperations()
    const contractForUnsigned = new stellarPkg.Contract(CONTRACT_ID)
    // The contract function is 'create_job' and takes (client, worker, amount) - no job_id parameter
    const opWithAuth = contractForUnsigned.call(
      'create_job',
      stellarPkg.Address.fromString(client).toScVal(),
      stellarPkg.Address.fromString(worker).toScVal(),
      stellarPkg.nativeToScVal(amount, { type: 'i64' })
    )
    // Apply auth from simulation result
    if (success.result && success.result.auth) {
      opWithAuth.auth = success.result.auth
    }
    unsignedBuilder.addOperation(opWithAuth)

    const unsignedTx = unsignedBuilder.setTimeout(300).build()
    const xdr = unsignedTx.toXDR()

    // Return unsigned XDR and fee info
    res.json({ unsigned_xdr: xdr, fee: unsignedBuilder.fee, network: raw.networkPassphrase, contract: CONTRACT_ID })
  } catch (err) {
    console.error('prepareCreateEscrow error:', err)
    res.status(500).json({ error: 'Failed to prepare create_escrow', details: err.message })
  }
}

// Finalize: accept signed XDR from client, submit to Soroban RPC and record payment
export const submitSignedSorobanTx = async (req, res) => {
  try {
    const { signed_xdr, job_id, client, worker, amount } = req.body
    if (!signed_xdr || !job_id || !client || !worker || !amount) return res.status(400).json({ error: 'signed_xdr, job_id, client, worker, amount required' })

    // Submit to soroban rpc
    const submitResult = await sorobanServer.sendTransaction(signed_xdr)

    // Record payment in supabase with status 'soroban_escrow'
    const { error } = await supabase.from('payments').insert([{ job_id, client_public_key: client, worker_public_key: worker, amount, transaction_hash: submitResult.hash || submitResult.id || null, status: 'soroban_escrow' }])
    if (error) console.error('supabase insert error:', error)

    res.json({ result: submitResult })
  } catch (err) {
    console.error('submitSignedSorobanTx error:', err)
    res.status(500).json({ error: 'Failed to submit signed soroban tx', details: err.message })
  }
}

// Prepare an unsigned Soroban transaction for release_to_worker
export const prepareReleaseEscrow = async (req, res) => {
  try {
    const { client, worker, job_id } = req.body
    if (!client || !worker || (job_id === undefined || job_id === null)) return res.status(400).json({ error: 'client, worker and job_id required' })

    // Build transaction for release
    const raw = { source: client, fee: '100', networkPassphrase: NETWORK_PASSPHRASE }
    const contract = new stellarPkg.Contract(CONTRACT_ID)
    const invokeOp = contract.call(
      'release',
      stellarPkg.Address.fromString(client).toScVal(),
      stellarPkg.Address.fromString(worker).toScVal(),
      stellarPkg.nativeToScVal(job_id, { type: 'u32' })
    )

    const accountStub = new Account(client, '0')
    const txBuilderForSim = new TransactionBuilder(accountStub, { fee: raw.fee, networkPassphrase: raw.networkPassphrase })
      .addOperation(invokeOp)
      .setTimeout(300)
    const txForSim = txBuilderForSim.build()

    const simulation = await sorobanServer.simulateTransaction(txForSim)
    const success = parseRawSimulation(simulation)
    if (!Api.isSimulationSuccess(success)) return res.status(400).json({ error: 'Simulation failed', details: success })

    const unsignedBuilder = TransactionBuilder.cloneFrom(txForSim, {
      fee: (parseInt(raw.fee || '0') + parseInt(success.minResourceFee || '0')).toString(),
      sorobanData: success.transactionData.build(),
      networkPassphrase: raw.networkPassphrase
    })

    unsignedBuilder.clearOperations()
    const contractForUnsigned = new stellarPkg.Contract(CONTRACT_ID)
    const opWithAuth = contractForUnsigned.call(
      'release',
      stellarPkg.Address.fromString(client).toScVal(),
      stellarPkg.Address.fromString(worker).toScVal(),
      stellarPkg.nativeToScVal(job_id, { type: 'u32' })
    )
    if (success.result && success.result.auth) {
      opWithAuth.auth = success.result.auth
    }
    unsignedBuilder.addOperation(opWithAuth)

    const unsignedTx = unsignedBuilder.setTimeout(300).build()
    const xdr = unsignedTx.toXDR()
    res.json({ unsigned_xdr: xdr, fee: unsignedBuilder.fee, network: raw.networkPassphrase, contract: CONTRACT_ID })
  } catch (err) {
    console.error('prepareReleaseEscrow error:', err)
    res.status(500).json({ error: 'Failed to prepare release', details: err.message })
  }
}

// Prepare an unsigned Soroban transaction for refund (not implemented in contract)
export const prepareRefundEscrow = async (req, res) => {
  try {
    // The current contract doesn't have a refund function
    res.status(400).json({ error: 'Refund function not implemented in contract' })
  } catch (err) {
    console.error('prepareRefundEscrow error:', err)
    res.status(500).json({ error: 'Failed to prepare refund', details: err.message })
  }
}
