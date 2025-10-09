import express from 'express'
import { prepareCreateEscrow, submitSignedSorobanTx, prepareReleaseEscrow, prepareRefundEscrow } from '../controllers/sorobanEscrowController.js'

const router = express.Router()

router.post('/prepare-create', prepareCreateEscrow)
router.post('/prepare-release', prepareReleaseEscrow)
router.post('/prepare-refund', prepareRefundEscrow)
router.post('/submit-signed', submitSignedSorobanTx)

export default router
