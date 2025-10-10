import { supabase } from './supabaseClient.js'

export const Job = {
  async create(jobData) {
    // Add default values for dual approval columns
    const jobWithDefaults = {
      ...jobData,
      worker_approved: false,
      employer_approved: false,
      employer_approved_at: null
    }

    const { data, error } = await supabase
      .from('jobs')
      .insert([jobWithDefaults])
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
        status: 'in_progress',
        assigned_at: new Date().toISOString()
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
        status: 'completed',
        completion_notes,
        completed_at: new Date().toISOString(),
        worker_approved: true  // Worker confirms they completed the job
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async employerApprove(id) {
    const { data, error } = await supabase
      .from('jobs')
      .update({ 
        employer_approved: true,  // Employer confirms they received service
        employer_approved_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async finalizeApproval(id) {
    // Only called when both worker and employer have approved
    const { data, error } = await supabase
      .from('jobs')
      .update({ 
        status: 'approved',
        approved_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Legacy method for backward compatibility
  async approve(id) {
    return this.finalizeApproval(id)
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