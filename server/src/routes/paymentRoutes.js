import express from 'express'
import { initiatePayment, getPaymentHistory } from '../controllers/paymentController.js'

const router = express.Router()

router.post('/initiate', initiatePayment)
router.get('/history', getPaymentHistory)

export default router