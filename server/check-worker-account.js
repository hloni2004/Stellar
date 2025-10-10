// Check worker account balance and recent transactions
import dotenv from 'dotenv'
import * as stellarPkg from '@stellar/stellar-sdk'

dotenv.config()

const Server = stellarPkg.Horizon.Server
const server = new Server('https://horizon-testnet.stellar.org')

const WORKER_PUBLIC_KEY = 'GCSY6JXGHDHUG36L5B3DGPYPHWUPRJEDLSTV3YUTHHGTJNUAXVHILHOF'

async function checkWorkerAccount() {
  try {
    console.log('🔍 Checking Worker Account Status')
    console.log('Worker Public Key:', WORKER_PUBLIC_KEY)
    console.log('')

    // Load account
    const account = await server.loadAccount(WORKER_PUBLIC_KEY)
    
    console.log('💰 Current Account Balance:')
    account.balances.forEach(balance => {
      if (balance.asset_type === 'native') {
        console.log(`  XLM: ${balance.balance}`)
      } else {
        console.log(`  ${balance.asset_code}: ${balance.balance}`)
      }
    })
    
    console.log('\n📝 Recent Transactions (Last 10):')
    const transactions = await server.transactions()
      .forAccount(WORKER_PUBLIC_KEY)
      .limit(10)
      .order('desc')
      .call()
    
    transactions.records.forEach((tx, i) => {
      console.log(`  ${i + 1}. ${tx.created_at}`)
      console.log(`     Hash: ${tx.hash}`)
      console.log(`     Source: ${tx.source_account.slice(0, 8)}...`)
      console.log('')
    })

    // Check specific payment transactions
    console.log('🎯 Looking for our specific payment transactions:')
    const paymentHashes = [
      'b68eb73ecec26cbb27a4cd0b79441bfc44e464febb0f9a3786a9ad06eb1a54aa',
      '8cc33bccee990fa38dddeb4e8617df8c0740d6ad4fceb2ab9d0accce162b21b5'
    ]

    for (const hash of paymentHashes) {
      try {
        const tx = await server.transactions().transaction(hash).call()
        console.log(`✅ Transaction ${hash.slice(0, 16)}... found!`)
        
        // Get operations for this transaction
        const operations = await server.operations().forTransaction(hash).call()
        operations.records.forEach(op => {
          if (op.type === 'payment') {
            console.log(`   Payment: ${op.amount} XLM to ${op.to.slice(0, 8)}...`)
          }
        })
      } catch (error) {
        console.log(`❌ Transaction ${hash.slice(0, 16)}... not found or error:`, error.message)
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking worker account:', error.message)
  }
}

checkWorkerAccount()