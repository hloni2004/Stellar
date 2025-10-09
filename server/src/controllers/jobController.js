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

// Worker marks job as completed
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
    res.json(updatedJob)
  } catch (error) {
    console.error('Error completing job:', error)
    res.status(500).json({ error: 'Failed to complete job' })
  }
}

// Employer approves completed work and releases payment
export const approveJobCompletion = async (req, res) => {
  try {
    const { id } = req.params
    const { employer_public_key } = req.body

    if (!employer_public_key) {
      return res.status(400).json({ error: 'Employer public key is required' })
    }

    const job = await Job.getById(id)
    
    // Find the payment for this job to verify employer
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('job_id', id)
      .eq('status', 'escrowed')
      .single()

    if (paymentError || !payment) {
      return res.status(404).json({ error: 'No escrowed payment found for this job' })
    }

    // Verify that the requester is the employer (client who made payment)
    if (payment.client_public_key !== employer_public_key) {
      return res.status(403).json({ error: 'Only the job employer can approve completion' })
    }

    if (job.status !== 'completed') {
      return res.status(400).json({ error: 'Job must be completed before approval' })
    }

    // Release the payment from escrow
    const releaseResponse = await fetch(`${req.protocol}://${req.get('host')}/api/escrow/release`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ payment_id: payment.id })
    })

    if (!releaseResponse.ok) {
      const errorData = await releaseResponse.json()
      return res.status(500).json({ error: 'Failed to release payment: ' + errorData.error })
    }

    // Update job status to approved
    const updatedJob = await Job.approve(id)
    
    res.json({ 
      job: updatedJob, 
      message: 'Job approved and payment released successfully',
      payment_released: payment.amount
    })
  } catch (error) {
    console.error('Error approving job:', error)
    res.status(500).json({ error: 'Failed to approve job completion' })
  }
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