import { supabase } from '../models/supabaseClient.js'

export const initiatePayment = async (req, res) => {
  try {
    const { job_id, client_public_key, worker_public_key, amount, transaction_hash } = req.body

    if (!job_id || !client_public_key || !worker_public_key || !amount || !transaction_hash) {
      return res.status(400).json({ error: 'All fields are required' })
    }

    // Record the payment in database
    const { data, error } = await supabase
      .from('payments')
      .insert([{
        job_id,
        client_public_key,
        worker_public_key,
        amount,
        transaction_hash,
        status: 'escrow'
      }])
      .select()
      .single()

    if (error) throw error

    // Update job status
    await supabase
      .from('jobs')
      .update({ status: 'in_progress' })
      .eq('id', job_id)

    res.status(201).json(data)
  } catch (error) {
    console.error('Error initiating payment:', error)
    res.status(500).json({ error: 'Failed to initiate payment' })
  }
}

export const getPaymentHistory = async (req, res) => {
  try {
    const { publicKey } = req.query

    if (!publicKey) {
      return res.status(400).json({ error: 'Public key is required' })
    }

    const { data, error } = await supabase
      .from('payments')
      // include related job's title, category and worker_public_key
      .select('*, jobs(title, category, worker_public_key)')
      .or(`client_public_key.eq.${publicKey},worker_public_key.eq.${publicKey}`)
      .order('created_at', { ascending: false })

    if (error) throw error

    res.json(data)
  } catch (error) {
    console.error('Error fetching payment history:', error)
    res.status(500).json({ error: 'Failed to fetch payment history' })
  }
}