import { Job } from '../models/Job.js'
import { supabase } from '../models/supabaseClient.js'

export const createJob = async (req, res) => {
  try {
    const { title, description, price, category, location, worker_public_key } = req.body

    if (!title || !description || !price || !category || !location || !worker_public_key) {
      return res.status(400).json({ error: 'All fields are required' })
    }

    const job = await Job.create({
      title,
      description,
      price,
      category,
      location,
      worker_public_key,
      status: 'open'
    })

    res.status(201).json(job)
  } catch (error) {
    console.error('Error creating job:', error)
    res.status(500).json({ error: 'Failed to create job' })
  }
}

export const getJobs = async (req, res) => {
  try {
    const jobs = await Job.getAll()
    res.json(jobs)
  } catch (error) {
    console.error('Error fetching jobs:', error)
    res.status(500).json({ error: 'Failed to fetch jobs' })
  }
}

export const getJobById = async (req, res) => {
  try {
    const { id } = req.params
    const job = await Job.getById(id)
    res.json(job)
  } catch (error) {
    console.error('Error fetching job:', error)
    res.status(500).json({ error: 'Job not found' })
  }
}

// Worker starts working on the job
export const startJob = async (req, res) => {
  try {
    const { id } = req.params
    const { worker_public_key } = req.body

    if (!worker_public_key) {
      return res.status(400).json({ error: 'Worker public key is required' })
    }

    // Get the job
    const job = await Job.getById(id)
    
    // Verify the worker is assigned to this job
    if (job.worker_public_key !== worker_public_key) {
      return res.status(403).json({ error: 'Only the assigned worker can start this job' })
    }

    // Check if job is in correct status to start
    if (job.status !== 'paid') {
      return res.status(400).json({ error: 'Job must be paid before it can be started' })
    }

    // Update job status to in_progress
    const updatedJob = await Job.updateStatus(id, 'in_progress')

    res.json({ 
      message: 'Job started successfully',
      job: updatedJob 
    })

  } catch (error) {
    console.error('Error starting job:', error)
    res.status(500).json({ error: 'Failed to start job' })
  }
}

// Worker marks job as completed and confirms they finished the work
export const completeJob = async (req, res) => {
  try {
    const { id } = req.params
    const { worker_public_key, completion_notes } = req.body

    if (!worker_public_key) {
      return res.status(400).json({ error: 'Worker public key is required' })
    }

    // Get the job first to verify worker
    const job = await Job.getById(id)
    if (job.worker_public_key !== worker_public_key) {
      return res.status(403).json({ error: 'Only the assigned worker can complete this job' })
    }

    if (job.status !== 'in_progress') {
      return res.status(400).json({ error: 'Job must be in progress to be completed' })
    }

    const updatedJob = await Job.complete(id, completion_notes)
    
    res.json({
      job: updatedJob,
      message: 'Job marked as completed. Waiting for employer approval to release payment.',
      next_step: 'Employer must now approve that they received the service'
    })
  } catch (error) {
    console.error('Error completing job:', error)
    res.status(500).json({ error: 'Failed to complete job' })
  }
}

// Employer approves that they received the service
export const employerApproveJob = async (req, res) => {
  try {
    const { id } = req.params
    const { employer_public_key } = req.body

    console.log('🏢 Employer approval request:', { jobId: id, employer: employer_public_key })

    if (!employer_public_key) {
      return res.status(400).json({ error: 'Employer public key is required' })
    }

    const job = await Job.getById(id)
    console.log('📋 Job details:', { 
      status: job.status, 
      worker_approved: job.worker_approved, 
      employer_approved: job.employer_approved,
      employer_key: job.employer_public_key
    })
    
    // Verify employer using the employer_public_key field (after migration)
    if (job.employer_public_key && job.employer_public_key !== employer_public_key) {
      return res.status(403).json({ error: 'Only the job employer can approve service receipt' })
    }
    
    // Fallback: Find the payment for this job to verify employer (before migration)
    if (!job.employer_public_key) {
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .select('*')
        .eq('job_id', id)
        .eq('status', 'escrowed')
        .single()

      if (paymentError || !payment) {
        return res.status(404).json({ error: 'No escrowed payment found for this job' })
      }

      if (payment.client_public_key !== employer_public_key) {
        return res.status(403).json({ error: 'Only the job employer can approve service receipt' })
      }
    }

    if (job.status !== 'completed') {
      return res.status(400).json({ error: 'Job must be completed by worker before employer approval' })
    }

    if (!job.worker_approved) {
      return res.status(400).json({ error: 'Worker must complete the job first before employer approval' })
    }

    // Mark employer as approved
    console.log('✅ Marking employer as approved for job:', id)
    const updatedJob = await Job.employerApprove(id)
    console.log('✅ Employer approval recorded:', updatedJob.employer_approved)
    
    // Check if both parties have approved
    if (updatedJob.worker_approved && updatedJob.employer_approved) {
      console.log('🎉 Both parties approved! Releasing payment...')
      // Both approved - release payment
      const finalJob = await releasePaymentAndFinalize(id)
      console.log('✅ Payment released successfully!')
      
      res.json({
        job: finalJob,
        message: 'Service confirmed! Both parties approved. Payment released to worker.',
        payment_released: true
      })
    } else {
      console.log('ℹ️ Waiting for worker completion. Worker approved:', updatedJob.worker_approved, 'Employer approved:', updatedJob.employer_approved)
      res.json({
        job: updatedJob,
        message: 'Service receipt confirmed. Payment will be released once both parties approve.',
        payment_released: false
      })
    }
  } catch (error) {
    console.error('Error approving service receipt:', error)
    res.status(500).json({ error: 'Failed to approve service receipt' })
  }
}

// Helper function to release payment and finalize job
async function releasePaymentAndFinalize(jobId) {
  console.log('🔍 Starting payment release for job:', jobId)
  
  // Find the payment for this job
  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .select('*')
    .eq('job_id', jobId)
    .eq('status', 'escrowed')
    .single()

  if (paymentError || !payment) {
    console.error('❌ No escrowed payment found:', paymentError)
    throw new Error('No escrowed payment found for this job')
  }

  console.log('💰 Found payment to release:', {
    id: payment.id,
    amount: payment.amount,
    worker: payment.worker_public_key,
    status: payment.status
  })

  try {
    // Release the payment from escrow using direct function call instead of HTTP request
    const escrowResult = await releaseEscrowDirect(payment.id)
    console.log('✅ Escrow release successful:', escrowResult)
  } catch (escrowError) {
    console.error('❌ Escrow release failed:', escrowError)
    throw new Error('Failed to release payment: ' + escrowError.message)
  }

  // Finalize job approval
  const finalJob = await Job.finalizeApproval(jobId)
  console.log('✅ Job finalized:', finalJob.id)
  return finalJob
}

// Direct escrow release function (avoid HTTP calls within server)
async function releaseEscrowDirect(paymentId) {
  const { supabase } = await import('../models/supabaseClient.js')
  const dotenv = await import('dotenv')
  dotenv.config()
  
  const ESCROW_SECRET = process.env.ESCROW_SECRET
  const NETWORK_PASSPHRASE = 'Test SDF Network ; September 2015'

  if (!ESCROW_SECRET) {
    throw new Error('Escrow not configured')
  }

  // Import Stellar SDK components
  const stellarPkg = await import('@stellar/stellar-sdk')
  const { Keypair, TransactionBuilder, Operation, Asset } = stellarPkg
  const Server = stellarPkg.Horizon.Server
  
  const server = new Server('https://horizon-testnet.stellar.org')

  // Fetch payment record
  const { data: payment, error: pErr } = await supabase
    .from('payments')
    .select('*')
    .eq('id', paymentId)
    .single()

  if (pErr || !payment) {
    throw new Error('Payment not found')
  }

  console.log('💸 Releasing payment:', {
    amount: payment.amount,
    to: payment.worker_public_key,
    from: 'escrow'
  })

  const escrowKP = Keypair.fromSecret(ESCROW_SECRET)
  const escrowAccount = await server.loadAccount(escrowKP.publicKey())

  const tx = new TransactionBuilder(escrowAccount, {
    fee: await server.fetchBaseFee(),
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(Operation.payment({
      destination: payment.worker_public_key,
      asset: Asset.native(),
      amount: payment.amount.toString(),
    }))
    .setTimeout(30)
    .build()

  tx.sign(escrowKP)
  const result = await server.submitTransaction(tx)

  console.log('🎉 Transaction submitted:', result.hash)

  // Update payment record
  await supabase.from('payments').update({ 
    status: 'paid', 
    released_at: new Date().toISOString() 
  }).eq('id', paymentId)

  return result
}

// Legacy endpoint for backward compatibility
export const approveJobCompletion = async (req, res) => {
  // Redirect to new employer approval endpoint
  return employerApproveJob(req, res)
}

// Assign worker to job
export const assignWorker = async (req, res) => {
  try {
    const { id } = req.params
    const { worker_public_key } = req.body

    if (!worker_public_key) {
      return res.status(400).json({ error: 'Worker public key is required' })
    }

    const job = await Job.getById(id)
    if (job.status !== 'open') {
      return res.status(400).json({ error: 'Job is not available for assignment' })
    }

    const updatedJob = await Job.assignWorker(id, worker_public_key)
    res.json(updatedJob)
  } catch (error) {
    console.error('Error assigning worker:', error)
    res.status(500).json({ error: 'Failed to assign worker' })
  }
}