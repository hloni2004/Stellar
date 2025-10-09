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
  }
}