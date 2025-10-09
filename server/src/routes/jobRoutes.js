import express from 'express'
import { createJob, getJobs, getJobById } from '../controllers/jobController.js'

const router = express.Router()

router.post('/create', createJob)
router.get('/', getJobs)
router.get('/:id', getJobById)

export default router