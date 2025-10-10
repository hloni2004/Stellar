// Fix inconsistent job states in database
import { supabase } from './src/models/supabaseClient.js'

async function fixJobStates() {
  try {
    console.log('🔧 Fixing inconsistent job states...')
    
    // Find jobs that are approved but status not updated
    const { data: jobs, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('worker_approved', true)
      .eq('employer_approved', true)
      .in('status', ['in_progress', 'completed'])

    if (error) {
      console.error('❌ Error fetching jobs:', error)
      return
    }

    console.log(`Found ${jobs.length} jobs needing status update:`)

    for (const job of jobs) {
      console.log(`\n📝 Fixing job: "${job.title}"`)
      console.log(`  Current status: ${job.status}`)
      console.log(`  Worker approved: ${job.worker_approved}`)
      console.log(`  Employer approved: ${job.employer_approved}`)

      // Update status to approved
      const { error: updateError } = await supabase
        .from('jobs')
        .update({ status: 'approved' })
        .eq('id', job.id)

      if (updateError) {
        console.error(`❌ Failed to update job ${job.id}:`, updateError)
      } else {
        console.log(`✅ Updated to status: approved`)
      }
    }

    console.log('\n🎉 Job state fixes completed!')

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

fixJobStates()