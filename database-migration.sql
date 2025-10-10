-- SkillLink Africa Database Schema Migration
-- This script adds all missing columns for enhanced job and payment tracking

-- ============================================================
-- JOBS TABLE ENHANCEMENTS
-- ============================================================

-- Add missing columns to jobs table
ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS employer_public_key TEXT,
ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS completion_notes TEXT;

-- Add comments for documentation
COMMENT ON COLUMN jobs.employer_public_key IS 'Stellar public key of the job employer/client';
COMMENT ON COLUMN jobs.assigned_at IS 'Timestamp when worker was assigned to the job';
COMMENT ON COLUMN jobs.completed_at IS 'Timestamp when worker marked job as completed';
COMMENT ON COLUMN jobs.approved_at IS 'Timestamp when employer approved the completed work';
COMMENT ON COLUMN jobs.completion_notes IS 'Optional notes from worker about the completed work';

-- ============================================================
-- PAYMENTS TABLE ENHANCEMENTS  
-- ============================================================

-- Add missing column to payments table
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS released_at TIMESTAMPTZ;

-- Add comment for documentation
COMMENT ON COLUMN payments.released_at IS 'Timestamp when payment was released from escrow to worker';

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_jobs_employer_public_key ON jobs(employer_public_key);
CREATE INDEX IF NOT EXISTS idx_jobs_worker_public_key ON jobs(worker_public_key);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_assigned_at ON jobs(assigned_at);
CREATE INDEX IF NOT EXISTS idx_jobs_completed_at ON jobs(completed_at);
CREATE INDEX IF NOT EXISTS idx_jobs_approved_at ON jobs(approved_at);

CREATE INDEX IF NOT EXISTS idx_payments_job_id ON payments(job_id);
CREATE INDEX IF NOT EXISTS idx_payments_client_public_key ON payments(client_public_key);
CREATE INDEX IF NOT EXISTS idx_payments_worker_public_key ON payments(worker_public_key);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_released_at ON payments(released_at);

-- ============================================================
-- DATA VALIDATION CONSTRAINTS
-- ============================================================

-- Add constraints for data integrity
ALTER TABLE jobs 
ADD CONSTRAINT IF NOT EXISTS check_valid_status 
CHECK (status IN ('open', 'paid', 'in_progress', 'completed', 'approved', 'cancelled'));

ALTER TABLE payments 
ADD CONSTRAINT IF NOT EXISTS check_valid_payment_status 
CHECK (status IN ('escrowed', 'paid', 'refunded', 'cancelled'));

-- Ensure positive amounts
ALTER TABLE payments 
ADD CONSTRAINT IF NOT EXISTS check_positive_amount 
CHECK (amount > 0);

-- ============================================================
-- UPDATE EXISTING DATA
-- ============================================================

-- Update existing jobs to have proper employer_public_key from payments
UPDATE jobs 
SET employer_public_key = p.client_public_key
FROM payments p 
WHERE jobs.id = p.job_id 
AND jobs.employer_public_key IS NULL;

-- Set assigned_at for jobs that are already in progress
UPDATE jobs 
SET assigned_at = COALESCE(updated_at, created_at)
WHERE status IN ('in_progress', 'completed', 'approved') 
AND assigned_at IS NULL;

-- Set completed_at for jobs that are already completed
UPDATE jobs 
SET completed_at = updated_at
WHERE status IN ('completed', 'approved') 
AND completed_at IS NULL;

-- Set approved_at for jobs that are already approved
UPDATE jobs 
SET approved_at = updated_at
WHERE status = 'approved' 
AND approved_at IS NULL;

-- Set released_at for payments that are already paid
UPDATE payments 
SET released_at = COALESCE(
    (SELECT updated_at FROM jobs WHERE jobs.id = payments.job_id AND status = 'approved'),
    payments.created_at
)
WHERE status = 'paid' 
AND released_at IS NULL;

-- ============================================================
-- VERIFY SCHEMA CHANGES
-- ============================================================

-- Show updated jobs table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'jobs' 
ORDER BY ordinal_position;

-- Show updated payments table structure  
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'payments' 
ORDER BY ordinal_position;

-- Show existing data counts
SELECT 
    'jobs' as table_name,
    COUNT(*) as total_records,
    COUNT(employer_public_key) as with_employer_key,
    COUNT(assigned_at) as with_assigned_at,
    COUNT(completed_at) as with_completed_at,
    COUNT(approved_at) as with_approved_at
FROM jobs
UNION ALL
SELECT 
    'payments' as table_name,
    COUNT(*) as total_records,
    COUNT(released_at) as with_released_at,
    0 as with_assigned_at,
    0 as with_completed_at,
    0 as with_approved_at
FROM payments;