import dotenv from 'dotenv'
import * as stellarPkg from '@stellar/stellar-sdk'
// The SDK exports Horizon namespace which contains Server — use Horizon.Server
const Server = stellarPkg.Horizon.Server
// Keypair, TransactionBuilder, Operation, Networks are re-exported from @stellar/stellar-base
const { Keypair, TransactionBuilder, Operation, Networks } = stellarPkg
import { supabase } from '../models/supabaseClient.js'

dotenv.config()

const HORIZON_URL = process.env.HORIZON_URL || 'https://horizon-testnet.stellar.org'
const ESCROW_SECRET = process.env.ESCROW_SECRET
const NETWORK_PASSPHRASE = process.env.STELLAR_NETWORK === 'PUBLIC' ? Networks.PUBLIC : Networks.TESTNET

const server = new Server(HORIZON_URL)

export const getEscrowAddress = async (req, res) => {
  try {
    if (!ESCROW_SECRET) return res.status(500).json({ error: 'Escrow not configured' })
    const kp = Keypair.fromSecret(ESCROW_SECRET)
    return res.json({ escrow: kp.publicKey() })
  } catch (err) {
    console.error('Escrow address error:', err)
    res.status(500).json({ error: 'Failed to get escrow address' })
  }
}

// Provide info about escrow configuration: legacy account escrow and/or Soroban contract
export const getEscrowInfo = async (req, res) => {
  try {
    const info = {}
    if (ESCROW_SECRET) {
      try {
        const kp = Keypair.fromSecret(ESCROW_SECRET)
        const escrowPublicKey = kp.publicKey()
        info.escrow = escrowPublicKey
        
        // Check if escrow account exists on testnet
        try {
          await server.loadAccount(escrowPublicKey)
          console.log('Escrow account exists:', escrowPublicKey)
        } catch (accountErr) {
          if (accountErr.response && accountErr.response.status === 404) {
            console.log('Escrow account does not exist, needs funding:', escrowPublicKey)
            console.log('Fund it with: curl "https://friendbot.stellar.org/?addr=' + escrowPublicKey + '"')
          }
        }
      } catch (secretErr) {
        console.error('Invalid ESCROW_SECRET in environment:', secretErr.message)
        // Don't fail the whole request, just skip account-based escrow
      }
    }
    // Since SOROBAN_CONTRACT_ID is commented out/empty, don't include Soroban contract info
    // const DEFAULT_SOROBAN_CONTRACT = 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC'
    // const sorobanContract = process.env.SOROBAN_CONTRACT_ID || DEFAULT_SOROBAN_CONTRACT
    const sorobanContract = process.env.SOROBAN_CONTRACT_ID
    if (sorobanContract) {
      info.soroban_contract = sorobanContract
      info.soroban_rpc = process.env.SOROBAN_RPC_URL || process.env.SOROBAN_RPC || 'https://soroban-testnet.stellar.org'
    }
    if (!info.escrow && !info.soroban_contract) {
      return res.status(500).json({ error: 'No escrow configured. Set ESCROW_SECRET for account-based escrow or SOROBAN_CONTRACT_ID/SOROBAN_RPC_URL for Soroban.' })
    }
    res.json(info)
  } catch (err) {
    console.error('Escrow info error:', err)
    res.status(500).json({ error: 'Failed to get escrow info' })
  }
}

// release funds from escrow to worker (server-side, requires ESCROW_SECRET)
export const releaseEscrow = async (req, res) => {
  try {
    const { payment_id } = req.body
    if (!payment_id) return res.status(400).json({ error: 'payment_id required' })

    // fetch payment record
    const { data: payment, error: pErr } = await supabase.from('payments').select('*').eq('id', payment_id).single()
    if (pErr || !payment) return res.status(404).json({ error: 'Payment not found' })

    if (!ESCROW_SECRET) return res.status(500).json({ error: 'Escrow not configured' })

    const escrowKP = Keypair.fromSecret(ESCROW_SECRET)
    const escrowAccount = await server.loadAccount(escrowKP.publicKey())

    const tx = new TransactionBuilder(escrowAccount, {
      fee: await server.fetchBaseFee(),
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(Operation.payment({
        destination: payment.worker_public_key,
        asset: { type: 'native' },
        amount: payment.amount.toString(),
      }))
      .setTimeout(30)
      .build()

    tx.sign(escrowKP)
    const result = await server.submitTransaction(tx)

    // update payment record
    await supabase.from('payments').update({ status: 'paid' }).eq('id', payment_id)

    res.json({ result })
  } catch (err) {
    console.error('Escrow release error:', err)
    res.status(500).json({ error: 'Failed to release escrow' })
  }
}
