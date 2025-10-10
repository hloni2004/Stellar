// Create a test job to demonstrate the complete workflow
import { supabase } from './src/models/supabaseClient.js'

async function createTestJob() {
  try {
    console.log('🧪 Creating test job for workflow demonstration...')
    
    const testJob = {
      title: 'Website Design',
      description: 'Design a modern landing page for a small business',
      price: 50,
      category: 'design',
      location: 'Cape Town',
      worker_public_key: 'GCSY6JXGHDHUG36L5B3DGPYPHWUPRJEDLSTV3YUTHHGTJNUAXVHILHOF',
      status: 'paid',
      employer_public_key: 'GB2IA3SIVSWHQRXVLMQIUZMQLMM3LY5DVNAGPB3YKZ3VGZQ3I54RSZWF',
      worker_approved: false,
      employer_approved: false,
      employer_approved_at: null
    }

    const { data: job, error } = await supabase
      .from('jobs')
      .insert([testJob])
      .select()
      .single()

    if (error) {
      console.error('❌ Error creating job:', error)
      return
    }

    console.log('✅ Test job created successfully!')
    console.log(`📋 Job ID: ${job.id}`)
    console.log(`📋 Title: ${job.title}`)
    console.log(`📋 Status: ${job.status}`)
    console.log(`📋 Price: ${job.price} XLM`)
    console.log('')
    console.log('🎯 This job is ready for the complete workflow:')
    console.log('1. Worker clicks "Start Job" (paid → in_progress)')
    console.log('2. Worker clicks "Complete & Approve Work" (adds completion notes)')
    console.log('3. Employer clicks "Confirm Service & Release Payment"')
    console.log('4. Payment automatically released to worker!')

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

createTestJob()