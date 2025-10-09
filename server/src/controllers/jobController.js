import { Job } from '../models/Job.js'

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