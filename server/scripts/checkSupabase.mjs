import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Load .env from the current working directory (should be server/ when run from project)
console.log('cwd:', process.cwd())
dotenv.config()

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_ANON_KEY

console.log('SUPABASE_URL set:', Boolean(url))
console.log('SUPABASE_ANON_KEY set:', Boolean(key))

if (!url || !key) {
  console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY in server/.env')
  process.exit(1)
}

const supabase = createClient(url, key)

;(async () => {
  try {
    const { data, error } = await supabase.from('jobs').select('id').limit(1)
    if (error) {
      console.error('Supabase error:', error)
      process.exit(1)
    }
    console.log('Supabase query OK, rows returned:', data.length)
  } catch (err) {
    console.error('Unexpected error:', err)
    process.exit(1)
  }
})()
