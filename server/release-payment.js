#!/usr/bin/env node
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import * as stellarPkg from '@stellar/stellar-sdk'

dotenv.config()

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing Supabase config. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SERVICE_KEY / SUPABASE_ANON_KEY) in env')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const ESCROW_SECRET = process.env.ESCROW_SECRET
const HORIZON_URL = process.env.HORIZON_URL || 'https://horizon-testnet.stellar.org'
const NETWORK = process.env.STELLAR_NETWORK || 'TESTNET'

if (!ESCROW_SECRET) {
  console.error('ESCROW_SECRET not set in environment')
  process.exit(1)
}

const paymentId = process.argv[2] || process.env.PAYMENT_ID
if (!paymentId) {
  console.error('Usage: node release-payment.js <payment_id>')
  process.exit(1)
}

async function main() {
  try {
    const { data: payment, error: pErr } = await supabase.from('payments').select('*').eq('id', paymentId).single()
    if (pErr || !payment) {
      console.error('Payment not found:', pErr)
      process.exit(1)
    }

    console.log('Found payment:', { id: payment.id, amount: payment.amount, worker: payment.worker_public_key, status: payment.status })

    const { Keypair, TransactionBuilder, Operation, Asset, Networks } = stellarPkg
    const Server = stellarPkg.Horizon.Server
    const NETWORK_PASSPHRASE = NETWORK === 'PUBLIC' ? Networks.PUBLIC : Networks.TESTNET
    const server = new Server(HORIZON_URL)

    const escrowKP = Keypair.fromSecret(ESCROW_SECRET)
    const escrowAccount = await server.loadAccount(escrowKP.publicKey())

    const tx = new TransactionBuilder(escrowAccount, {
      fee: await server.fetchBaseFee(),
      networkPassphrase: NETWORK_PASSPHRASE
    })
      .addOperation(Operation.payment({
        destination: payment.worker_public_key,
        asset: Asset.native(),
        amount: payment.amount.toString()
      }))
      .setTimeout(30)
      .build()

    tx.sign(escrowKP)
    const result = await server.submitTransaction(tx)
    console.log('Transaction submitted:', result.hash)

    await supabase.from('payments').update({ status: 'paid', released_at: new Date().toISOString() }).eq('id', paymentId)
    console.log('Payment record updated to paid')
    process.exit(0)
  } catch (err) {
    console.error('Error releasing payment:', err)
    process.exit(1)
  }
}

main()
