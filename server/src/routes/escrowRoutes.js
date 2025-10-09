import express from 'express'
import { getEscrowAddress, releaseEscrow, getEscrowInfo } from '../controllers/escrowController.js'

const router = express.Router()

router.get('/address', getEscrowAddress)
router.get('/info', getEscrowInfo)
router.post('/release', releaseEscrow)

export default router
