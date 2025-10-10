import dotenv from 'dotenv'
import { supabase } from './server/src/models/supabaseClient.js'

// Load environment variables  
dotenv.config({ path: './server/.env' })

async function verifyMigration() {
  console.log('🔍 Verifying SkillLink Africa Database Migration...\n')

  try {
    // Check jobs table structure
    console.log('📋 Checking jobs table...')
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select('*')
      .limit(1)

    if (jobsError) {
      console.error('❌ Error accessing jobs table:', jobsError.message)
      return false
    }

    const jobColumns = jobs[0] ? Object.keys(jobs[0]) : []
    const requiredJobColumns = [
      'employer_public_key',
      'assigned_at', 
      'completed_at',
      'approved_at',
      'completion_notes'
    ]

    console.log('Current jobs columns:', jobColumns)

    const missingJobColumns = requiredJobColumns.filter(col => !jobColumns.includes(col))
    
    if (missingJobColumns.length === 0) {
      console.log('✅ Jobs table: All required columns present')
    } else {
      console.log('❌ Jobs table: Missing columns:', missingJobColumns)
    }

    // Check payments table structure
    console.log('\n💳 Checking payments table...')
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('*')
      .limit(1)

    if (paymentsError) {
      console.error('❌ Error accessing payments table:', paymentsError.message)
      return false
    }

    const paymentColumns = payments[0] ? Object.keys(payments[0]) : []
    const requiredPaymentColumns = ['released_at']

    console.log('Current payments columns:', paymentColumns)

    const missingPaymentColumns = requiredPaymentColumns.filter(col => !paymentColumns.includes(col))
    
    if (missingPaymentColumns.length === 0) {
      console.log('✅ Payments table: All required columns present')
    } else {
      console.log('❌ Payments table: Missing columns:', missingPaymentColumns)
    }

    // Test enhanced functionality
    console.log('\n🧪 Testing enhanced functionality...')
    
    // Test job creation with enhanced fields
    const testJob = {
      title: 'Migration Test Job',
      description: 'Testing enhanced schema',
      price: 10,
      category: 'Testing',
      location: 'Remote',
      worker_public_key: 'TEST_WORKER_KEY',
      employer_public_key: 'TEST_EMPLOYER_KEY',
      status: 'open'
    }

    const { data: createdJob, error: createError } = await supabase
      .from('jobs')
      .insert([testJob])
      .select()
      .single()

    if (createError) {
      console.log('❌ Enhanced job creation test failed:', createError.message)
    } else {
      console.log('✅ Enhanced job creation test passed')
      
      // Clean up test job
      await supabase.from('jobs').delete().eq('id', createdJob.id)
    }

    // Summary
    const allMissingColumns = [...missingJobColumns, ...missingPaymentColumns]
    
    console.log('\n📊 Migration Summary:')
    console.log(`Jobs table: ${requiredJobColumns.length - missingJobColumns.length}/${requiredJobColumns.length} columns present`)
    console.log(`Payments table: ${requiredPaymentColumns.length - missingPaymentColumns.length}/${requiredPaymentColumns.length} columns present`)
    
    if (allMissingColumns.length === 0) {
      console.log('\n🎉 Migration completed successfully!')
      console.log('✅ All enhanced features are now available:')
      console.log('   • Enhanced job tracking with timestamps')
      console.log('   • Employer identification in job records')  
      console.log('   • Worker completion notes')
      console.log('   • Payment release timestamps')
      console.log('   • Improved job lifecycle management')
      return true
    } else {
      console.log('\n⚠️  Migration incomplete!')
      console.log('Please add the missing columns manually in Supabase dashboard.')
      console.log('See MIGRATION_GUIDE.md for detailed instructions.')
      return false
    }

  } catch (error) {
    console.error('❌ Verification failed:', error)
    return false
  }
}

async function main() {
  const success = await verifyMigration()
  process.exit(success ? 0 : 1)
}

main().catch(console.error)