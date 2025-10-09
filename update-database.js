import dotenv from 'dotenv'
import { supabase } from './server/src/models/supabaseClient.js'

// Load environment variables
dotenv.config({ path: './server/.env' })

async function updateDatabaseSchema() {
  console.log('Starting database schema update...')
  
  try {
    // Execute the SQL to add missing columns
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        -- Add missing columns to jobs table
        ALTER TABLE jobs 
        ADD COLUMN IF NOT EXISTS employer_public_key TEXT,
        ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS completion_notes TEXT;
        
        -- Add indexes for better query performance
        CREATE INDEX IF NOT EXISTS idx_jobs_worker_public_key ON jobs(worker_public_key);
        CREATE INDEX IF NOT EXISTS idx_jobs_employer_public_key ON jobs(employer_public_key);
        CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
        
        -- Create or update the payments table if it doesn't exist
        CREATE TABLE IF NOT EXISTS payments (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
            client_public_key TEXT NOT NULL,
            worker_public_key TEXT NOT NULL,
            amount DECIMAL(20,7) NOT NULL,
            transaction_hash TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'escrowed',
            created_at TIMESTAMPTZ DEFAULT NOW(),
            released_at TIMESTAMPTZ,
            UNIQUE(job_id)
        );
        
        -- Add indexes for payments table
        CREATE INDEX IF NOT EXISTS idx_payments_job_id ON payments(job_id);
        CREATE INDEX IF NOT EXISTS idx_payments_client_public_key ON payments(client_public_key);
        CREATE INDEX IF NOT EXISTS idx_payments_worker_public_key ON payments(worker_public_key);
        CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
      `
    })

    if (error) {
      console.error('Error executing SQL via RPC:', error)
      
      // Fallback: Try direct table operations
      console.log('Trying fallback approach with direct operations...')
      
      // Check if we can query the jobs table structure
      const { data: existingColumns, error: columnsError } = await supabase
        .from('jobs')
        .select('*')
        .limit(1)
      
      if (columnsError) {
        console.error('Error querying jobs table:', columnsError)
        return false
      }
      
      console.log('Current jobs table structure detected')
      console.log('Sample data keys:', existingColumns[0] ? Object.keys(existingColumns[0]) : 'No data')
      
      // Try to create payments table
      console.log('Note: You may need to manually add these columns to your Supabase database:')
      console.log('1. employer_public_key (TEXT)')
      console.log('2. assigned_at (TIMESTAMPTZ)')
      console.log('3. completed_at (TIMESTAMPTZ)')
      console.log('4. approved_at (TIMESTAMPTZ)')
      console.log('5. completion_notes (TEXT)')
      
      return false
    }
    
    console.log('Database schema updated successfully!')
    return true
    
  } catch (error) {
    console.error('Error updating database schema:', error)
    return false
  }
}

// Alternative approach: Check and show current table structure
async function checkTableStructure() {
  console.log('Checking current table structure...')
  
  try {
    // Get a sample record to see current columns
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select('*')
      .limit(1)
    
    if (jobsError) {
      console.error('Error querying jobs:', jobsError)
    } else {
      console.log('Jobs table columns:', jobs[0] ? Object.keys(jobs[0]) : 'No data')
    }
    
    // Check payments table
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('*')
      .limit(1)
    
    if (paymentsError) {
      console.log('Payments table does not exist or has no access')
    } else {
      console.log('Payments table columns:', payments[0] ? Object.keys(payments[0]) : 'No data')
    }
    
  } catch (error) {
    console.error('Error checking table structure:', error)
  }
}

// Run the functions
async function main() {
  await checkTableStructure()
  console.log('\n' + '='.repeat(50) + '\n')
  await updateDatabaseSchema()
}

main().catch(console.error)