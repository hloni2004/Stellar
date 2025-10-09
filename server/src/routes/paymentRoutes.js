import express from 'express'
import { initiatePayment, getPaymentHistory, getJobPaymentStatus } from '../controllers/paymentController.js'

const router = express.Router()

router.post('/initiate', initiatePayment)
router.get('/history', getPaymentHistory)
router.get('/job/:job_id/status', getJobPaymentStatus)

export default router