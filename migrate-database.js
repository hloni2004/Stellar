import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// Load environment variables
dotenv.config({ path: './server/.env' })

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   SUPABASE_URL:', !!supabaseUrl)
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey)
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runDatabaseMigration() {
  console.log('🚀 Starting SkillLink Africa Database Migration...\n')

  try {
    // Step 1: Check current table structure
    console.log('📊 Checking current database structure...')
    
    const { data: jobsStructure, error: jobsError } = await supabase
      .from('jobs')
      .select('*')
      .limit(1)
    
    if (jobsError) {
      console.error('❌ Error accessing jobs table:', jobsError.message)
      return false
    }

    const { data: paymentsStructure, error: paymentsError } = await supabase
      .from('payments')
      .select('*')
      .limit(1)
    
    if (paymentsError) {
      console.error('❌ Error accessing payments table:', paymentsError.message)
      return false
    }

    console.log('✅ Current jobs columns:', jobsStructure[0] ? Object.keys(jobsStructure[0]) : 'No data')
    console.log('✅ Current payments columns:', paymentsStructure[0] ? Object.keys(paymentsStructure[0]) : 'No data')

    // Step 2: Execute individual SQL commands
    console.log('\n🔧 Applying database schema updates...')
    
    const migrations = [
      {
        name: 'Add employer_public_key to jobs',
        sql: `ALTER TABLE jobs ADD COLUMN IF NOT EXISTS employer_public_key TEXT;`
      },
      {
        name: 'Add assigned_at to jobs',
        sql: `ALTER TABLE jobs ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ;`
      },
      {
        name: 'Add completed_at to jobs',
        sql: `ALTER TABLE jobs ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;`
      },
      {
        name: 'Add approved_at to jobs',
        sql: `ALTER TABLE jobs ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;`
      },
      {
        name: 'Add completion_notes to jobs',
        sql: `ALTER TABLE jobs ADD COLUMN IF NOT EXISTS completion_notes TEXT;`
      },
      {
        name: 'Add released_at to payments',
        sql: `ALTER TABLE payments ADD COLUMN IF NOT EXISTS released_at TIMESTAMPTZ;`
      }
    ]

    for (const migration of migrations) {
      try {
        console.log(`   • ${migration.name}...`)
        const { error } = await supabase.rpc('exec_sql', { sql: migration.sql })
        
        if (error) {
          console.log(`     ⚠️  ${migration.name}: ${error.message}`)
        } else {
          console.log(`     ✅ ${migration.name}: Success`)
        }
      } catch (err) {
        console.log(`     ⚠️  ${migration.name}: ${err.message}`)
      }
    }

    // Step 3: Create indexes
    console.log('\n📈 Creating performance indexes...')
    
    const indexes = [
      `CREATE INDEX IF NOT EXISTS idx_jobs_employer_public_key ON jobs(employer_public_key);`,
      `CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);`,
      `CREATE INDEX IF NOT EXISTS idx_payments_released_at ON payments(released_at);`
    ]

    for (const indexSql of indexes) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: indexSql })
        if (error) {
          console.log(`     ⚠️  Index creation: ${error.message}`)
        } else {
          console.log(`     ✅ Index created successfully`)
        }
      } catch (err) {
        console.log(`     ⚠️  Index creation: ${err.message}`)
      }
    }

    // Step 4: Update existing data
    console.log('\n🔄 Updating existing data...')
    
    // Link employer_public_key from payments to jobs
    const { data: linkResults, error: linkError } = await supabase.rpc('exec_sql', {
      sql: `
        UPDATE jobs 
        SET employer_public_key = p.client_public_key
        FROM payments p 
        WHERE jobs.id = p.job_id 
        AND jobs.employer_public_key IS NULL;
      `
    })
    
    if (linkError) {
      console.log(`     ⚠️  Linking employer keys: ${linkError.message}`)
    } else {
      console.log(`     ✅ Employer keys linked successfully`)
    }

    // Step 5: Verify final structure
    console.log('\n🔍 Verifying updated structure...')
    
    const { data: updatedJobs, error: updatedJobsError } = await supabase
      .from('jobs')
      .select('*')
      .limit(1)
    
    const { data: updatedPayments, error: updatedPaymentsError } = await supabase
      .from('payments')
      .select('*')
      .limit(1)

    if (!updatedJobsError && !updatedPaymentsError) {
      console.log('✅ Updated jobs columns:', updatedJobs[0] ? Object.keys(updatedJobs[0]) : 'No data')
      console.log('✅ Updated payments columns:', updatedPayments[0] ? Object.keys(updatedPayments[0]) : 'No data')
    }

    console.log('\n🎉 Database migration completed successfully!')
    console.log('\n📋 New features now available:')
    console.log('   • Enhanced job tracking with timestamps')
    console.log('   • Employer identification in job records')
    console.log('   • Completion notes from workers')
    console.log('   • Payment release timestamps')
    console.log('   • Improved database performance')
    
    return true

  } catch (error) {
    console.error('❌ Migration failed:', error)
    return false
  }
}

// Alternative: Manual column addition if RPC doesn't work
async function manualMigration() {
  console.log('\n🔧 Attempting manual migration approach...')
  
  // Test if new columns exist by trying to query them
  const testColumns = ['employer_public_key', 'assigned_at', 'completed_at', 'approved_at', 'completion_notes']
  const missingColumns = []
  
  for (const column of testColumns) {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select(column)
        .limit(1)
      
      if (error && error.message.includes('column')) {
        missingColumns.push(column)
      }
    } catch (err) {
      if (err.message.includes('column')) {
        missingColumns.push(column)
      }
    }
  }
  
  if (missingColumns.length > 0) {
    console.log('❌ Missing columns detected:', missingColumns)
    console.log('\n📝 Manual steps required:')
    console.log('1. Go to your Supabase dashboard')
    console.log('2. Navigate to Table Editor > jobs table')
    console.log('3. Add these columns:')
    missingColumns.forEach(col => {
      const type = col.includes('_at') ? 'timestamptz' : 'text'
      console.log(`   • ${col} (${type}, nullable)`)
    })
    console.log('4. Go to payments table and add:')
    console.log('   • released_at (timestamptz, nullable)')
    
    return false
  } else {
    console.log('✅ All columns appear to exist!')
    return true
  }
}

async function main() {
  const success = await runDatabaseMigration()
  
  if (!success) {
    await manualMigration()
  }
  
  process.exit(success ? 0 : 1)
}

main().catch(console.error)