import express from 'express'
import { 
  createJob, 
  getJobs, 
  getJobById, 
  startJob,
  completeJob, 
  employerApproveJob,
  approveJobCompletion, // Legacy endpoint
  assignWorker 
} from '../controllers/jobController.js'

const router = express.Router()

router.post('/create', createJob)
router.get('/', getJobs)
router.get('/:id', getJobById)
router.post('/:id/assign', assignWorker)
router.post('/:id/start', startJob)
router.post('/:id/complete', completeJob)
router.post('/:id/employer-approve', employerApproveJob)
router.post('/:id/approve', approveJobCompletion) // Legacy - redirects to employer-approve

export default router