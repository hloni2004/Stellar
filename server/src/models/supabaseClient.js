import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  throw new Error('Missing SUPABASE_URL in environment')
}

// Prefer service role key on the server to allow privileged operations (e.g. inserting
// rows when Row Level Security is enabled). Make sure this key is kept secret and
// not committed to source control.
const supabaseKey = supabaseServiceRole || supabaseAnonKey

if (!supabaseKey) {
  throw new Error('Missing Supabase API key (SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY)')
}

if (supabaseServiceRole) {
  console.log('Supabase: using service_role key (server). RLS bypass enabled).')
} else {
  console.log('Supabase: using anon key. Ensure table policies allow required operations.')
}

export const supabase = createClient(supabaseUrl, supabaseKey)