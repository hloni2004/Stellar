-- Create chat_messages table for real-time communication between workers and clients

CREATE TABLE IF NOT EXISTS chat_messages (
    id SERIAL PRIMARY KEY,
    job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    sender_public_key TEXT NOT NULL,
    message TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text', -- 'text' or 'price_offer'
    price_offer DECIMAL(10, 2), -- Only for price offer messages
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_job_id ON chat_messages(job_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON chat_messages(sender_public_key);

-- Enable RLS (Row Level Security)
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to view messages for jobs they're involved in
CREATE POLICY "Users can view messages for their jobs" ON chat_messages
    FOR SELECT USING (
        job_id IN (
            SELECT id FROM jobs 
            WHERE worker_public_key = auth.jwt() ->> 'sub' 
               OR client_public_key = auth.jwt() ->> 'sub'
        )
    );

-- Create policy to allow users to send messages for jobs they're involved in
CREATE POLICY "Users can send messages for their jobs" ON chat_messages
    FOR INSERT WITH CHECK (
        sender_public_key = auth.jwt() ->> 'sub' AND
        job_id IN (
            SELECT id FROM jobs 
            WHERE worker_public_key = auth.jwt() ->> 'sub' 
               OR client_public_key = auth.jwt() ->> 'sub'
        )
    );

-- Add client_public_key column to jobs table if it doesn't exist
-- This is needed to track who can chat about each job
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'jobs' AND column_name = 'client_public_key') THEN
        ALTER TABLE jobs ADD COLUMN client_public_key TEXT;
    END IF;
END $$;

-- Create an index on the new column
CREATE INDEX IF NOT EXISTS idx_jobs_client_public_key ON jobs(client_public_key);

COMMENT ON TABLE chat_messages IS 'Stores chat messages between job workers and clients';
COMMENT ON COLUMN chat_messages.message_type IS 'Type of message: text, price_offer';
COMMENT ON COLUMN chat_messages.price_offer IS 'Price offered when message_type is price_offer';