// Test script to verify payment release functionality
import dotenv from 'dotenv'
import { supabase } from './src/models/supabaseClient.js'

dotenv.config()

async function testPaymentRelease() {
  try {
    console.log('🧪 Testing Payment Release Functionality')
    console.log('')

    // Check for active jobs with escrowed payments
    const { data: payments, error } = await supabase
      .from('payments')
      .select(`
        *,
        jobs:job_id (
          id,
          title,
          status,
          worker_approved,
          employer_approved
        )
      `)
      .eq('status', 'escrowed')

    if (error) {
      console.error('❌ Error fetching payments:', error)
      return
    }

    console.log(`📋 Found ${payments.length} escrowed payments:`)
    
    payments.forEach((payment, i) => {
      console.log(`\n${i + 1}. Payment ID: ${payment.id}`)
      console.log(`   Job: "${payment.jobs.title}"`)
      console.log(`   Amount: ${payment.amount} XLM`)
      console.log(`   Worker: ${payment.worker_public_key.slice(0, 8)}...`)
      console.log(`   Job Status: ${payment.jobs.status}`)
      console.log(`   Worker Approved: ${payment.jobs.worker_approved}`)
      console.log(`   Employer Approved: ${payment.jobs.employer_approved}`)
      
      if (payment.jobs.worker_approved && payment.jobs.employer_approved) {
        console.log('   🎉 READY FOR PAYMENT RELEASE!')
      } else if (payment.jobs.worker_approved) {
        console.log('   ⏳ Waiting for employer approval')
      } else {
        console.log('   ⏳ Waiting for worker completion')
      }
    })

    if (payments.length === 0) {
      console.log('ℹ️ No escrowed payments found')
      console.log('💡 Create a job and complete the workflow to test payment release')
    }

  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testPaymentRelease()