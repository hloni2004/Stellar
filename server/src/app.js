import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import jobRoutes from './routes/jobRoutes.js'
import paymentRoutes from './routes/paymentRoutes.js'
import { supabase } from './models/supabaseClient.js'
import authRoutes from './routes/authRoutes.js'
import escrowRoutes from './routes/escrowRoutes.js'
import sorobanEscrowRoutes from './routes/sorobanEscrowRoutes.js'
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(helmet())
app.use(cors())
app.use(express.json())

// Routes
app.use('/api/jobs', jobRoutes)
app.use('/api/payments', paymentRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/escrow', escrowRoutes)
app.use('/api/soroban-escrow', sorobanEscrowRoutes)
// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', network: process.env.STELLAR_NETWORK })
})

app.listen(PORT, () => {
  console.log(`SkillLink Africa server running on port ${PORT}`)
  console.log(`Stellar Network: ${process.env.STELLAR_NETWORK}`)
  // Quick Supabase connectivity check
  ;(async () => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('id')
        .limit(1)

      if (error) {
        console.error('Supabase connectivity check failed:', error)
      } else {
        console.log('Supabase connectivity check OK')
      }
    } catch (err) {
      console.error('Supabase connectivity error:', err)
    }
  })()
})