// Debug script to check escrow account balance and recent transactions
import dotenv from 'dotenv'
import * as stellarPkg from '@stellar/stellar-sdk'

dotenv.config()

const { Keypair } = stellarPkg
const Server = stellarPkg.Horizon.Server

const server = new Server('https://horizon-testnet.stellar.org')

const ESCROW_SECRET = process.env.ESCROW_SECRET

async function debugEscrowAccount() {
  try {
    if (!ESCROW_SECRET) {
      console.error('❌ ESCROW_SECRET not configured')
      return
    }

    const escrowKP = Keypair.fromSecret(ESCROW_SECRET)
    const escrowPublicKey = escrowKP.publicKey()
    
    console.log('🔍 Escrow Account Debug')
    console.log('Public Key:', escrowPublicKey)
    console.log('Network:', process.env.STELLAR_NETWORK)
    
    // Load account
    const account = await server.loadAccount(escrowPublicKey)
    
    console.log('\n💰 Account Balances:')
    account.balances.forEach(balance => {
      if (balance.asset_type === 'native') {
        console.log(`  XLM: ${balance.balance}`)
      } else {
        console.log(`  ${balance.asset_code}: ${balance.balance}`)
      }
    })
    
    console.log('\n📊 Account Info:')
    console.log(`  Sequence: ${account.sequence}`)
    console.log(`  Subentry Count: ${account.subentry_count}`)
    
    // Get recent transactions
    console.log('\n📝 Recent Transactions:')
    const transactions = await server.transactions()
      .forAccount(escrowPublicKey)
      .limit(5)
      .order('desc')
      .call()
    
    transactions.records.forEach((tx, i) => {
      console.log(`  ${i + 1}. ${tx.created_at} - Hash: ${tx.hash.slice(0, 16)}...`)
    })
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

debugEscrowAccount()