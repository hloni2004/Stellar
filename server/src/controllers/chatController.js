import { supabase } from '../models/supabaseClient.js'

// Get chat messages for a specific job
export const getChatMessages = async (req, res) => {
  try {
    const { jobId } = req.params
    const { publicKey } = req.query

    if (!jobId || !publicKey) {
      return res.status(400).json({ error: 'Job ID and public key are required' })
    }

    // Verify user is either the client or worker for this job
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single()

    if (jobError || !job) {
      return res.status(404).json({ error: 'Job not found' })
    }

    // Check if user is authorized to view this chat
    const isAuthorized = job.worker_public_key === publicKey || 
                        job.client_public_key === publicKey

    if (!isAuthorized) {
      return res.status(403).json({ error: 'Not authorized to view this chat' })
    }

    // Get messages for this job
    const { data: messages, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('job_id', jobId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching messages:', error)
      return res.status(500).json({ error: 'Failed to fetch messages' })
    }

    res.json({ messages: messages || [] })
  } catch (error) {
    console.error('Chat messages error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

// Send a new message
export const sendMessage = async (req, res) => {
  try {
    const { job_id, sender_public_key, message, message_type = 'text', price_offer } = req.body

    if (!job_id || !sender_public_key || !message) {
      return res.status(400).json({ error: 'Job ID, sender, and message are required' })
    }

    // Verify user is authorized for this job
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', job_id)
      .single()

    if (jobError || !job) {
      return res.status(404).json({ error: 'Job not found' })
    }

    const isAuthorized = job.worker_public_key === sender_public_key || 
                        job.client_public_key === sender_public_key

    if (!isAuthorized) {
      return res.status(403).json({ error: 'Not authorized to send messages for this job' })
    }

    // If it's a price offer from worker, update the job price
    if (message_type === 'price_offer' && price_offer && job.worker_public_key === sender_public_key) {
      const { error: updateError } = await supabase
        .from('jobs')
        .update({ price: price_offer })
        .eq('id', job_id)

      if (updateError) {
        console.error('Error updating job price:', updateError)
        return res.status(500).json({ error: 'Failed to update job price' })
      }
    }

    // Insert the message
    const { data: newMessage, error } = await supabase
      .from('chat_messages')
      .insert([{
        job_id,
        sender_public_key,
        message,
        message_type,
        price_offer: message_type === 'price_offer' ? price_offer : null
      }])
      .select()
      .single()

    if (error) {
      console.error('Error sending message:', error)
      return res.status(500).json({ error: 'Failed to send message' })
    }

    res.json(newMessage)
  } catch (error) {
    console.error('Send message error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}