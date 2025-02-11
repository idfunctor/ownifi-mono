-- Add new fields to users table
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS is_onboarded BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}'::jsonb; 