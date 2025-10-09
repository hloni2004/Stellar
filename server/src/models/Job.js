import { supabase } from './supabaseClient.js'

export const Job = {
  async create(jobData) {
    const { data, error } = await supabase
      .from('jobs')
      .insert([jobData])
      .select()
      .single()

    if (error) throw error
    return data
  },

  async getAll() {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  async getById(id) {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  async updateStatus(id, status) {
    const { data, error } = await supabase
      .from('jobs')
      .update({ status })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async assignWorker(id, worker_public_key) {
    const { data, error } = await supabase
      .from('jobs')
      .update({ 
        worker_public_key,
        status: 'in_progress'
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async complete(id, completion_notes = null) {
    const { data, error } = await supabase
      .from('jobs')
      .update({ 
        status: 'completed'
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async approve(id) {
    const { data, error } = await supabase
      .from('jobs')
      .update({ 
        status: 'approved'
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async getJobsByWorker(worker_public_key) {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('worker_public_key', worker_public_key)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  async getJobsByEmployer(employer_public_key) {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('employer_public_key', employer_public_key)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }
}