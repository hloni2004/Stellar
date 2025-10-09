import express from 'express'
import { 
  createJob, 
  getJobs, 
  getJobById, 
  completeJob, 
  approveJobCompletion, 
  assignWorker 
} from '../controllers/jobController.js'

const router = express.Router()

router.post('/create', createJob)
router.get('/', getJobs)
router.get('/:id', getJobById)
router.post('/:id/assign', assignWorker)
router.post('/:id/complete', completeJob)
router.post('/:id/approve', approveJobCompletion)

export default router