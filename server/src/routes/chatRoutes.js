import express from 'express'
import { getChatMessages, sendMessage } from '../controllers/chatController.js'

const router = express.Router()

// Get chat messages for a job
router.get('/:jobId', getChatMessages)

// Send a message
router.post('/send', sendMessage)

export default router