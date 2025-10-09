-- Database schema update for SkillLink Africa job completion workflow
-- This script adds the missing columns to the jobs table

-- Add missing columns to jobs table
ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS employer_public_key TEXT,
ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS completion_notes TEXT;

-- Update existing jobs to have proper status values
-- Note: Existing jobs might need manual review for proper status assignment

-- Add index for better query performance
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
    UNIQUE(job_id) -- One payment per job
);

-- Add indexes for payments table
CREATE INDEX IF NOT EXISTS idx_payments_job_id ON payments(job_id);
CREATE INDEX IF NOT EXISTS idx_payments_client_public_key ON payments(client_public_key);
CREATE INDEX IF NOT EXISTS idx_payments_worker_public_key ON payments(worker_public_key);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- Optional: Add some constraints for data integrity
-- ALTER TABLE jobs ADD CONSTRAINT check_valid_status 
-- CHECK (status IN ('open', 'paid', 'in_progress', 'completed', 'approved', 'cancelled'));

-- ALTER TABLE payments ADD CONSTRAINT check_valid_payment_status 
-- CHECK (status IN ('escrowed', 'paid', 'refunded'));

-- Show current structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'jobs' 
ORDER BY ordinal_position;