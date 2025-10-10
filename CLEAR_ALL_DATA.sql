-- 🗑️ CLEAR ALL DATA FROM ALL TABLES
-- ⚠️ WARNING: This will permanently delete ALL data in your database!
-- Only run this if you're sure you want to start fresh

-- Clear all data from tables (in correct order to avoid foreign key conflicts)

-- 1. Clear payments table first (if it references jobs)
TRUNCATE TABLE payments RESTART IDENTITY CASCADE;

-- 2. Clear jobs table
TRUNCATE TABLE jobs RESTART IDENTITY CASCADE;

-- 3. Clear any other tables you might have
-- Add more TRUNCATE statements here for other tables if needed
-- TRUNCATE TABLE your_other_table RESTART IDENTITY CASCADE;

-- ✅ What this does:
-- - TRUNCATE removes all rows from tables
-- - RESTART IDENTITY resets auto-increment counters back to 1
-- - CASCADE handles foreign key dependencies automatically

-- After running this, you can:
-- 1. Set employer_approved_at as NOT NULL (no NULL values will exist)
-- 2. Add the worker_approved and employer_approved boolean columns
-- 3. Start fresh with your dual approval system

-- 💡 To run this in Supabase:
-- 1. Go to Supabase Dashboard
-- 2. Navigate to SQL Editor
-- 3. Copy and paste this code
-- 4. Click "Run" button
-- 5. Confirm the operation