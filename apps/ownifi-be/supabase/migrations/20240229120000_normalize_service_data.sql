-- Create enum for service types
CREATE TYPE service_type AS ENUM ('spotify', 'apple_music');

-- Create user_services table to track connected services
CREATE TABLE user_services (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    service service_type NOT NULL,
    connected_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    last_synced_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    PRIMARY KEY (user_id, service)
);

-- Create spotify_profiles table
CREATE TABLE spotify_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    spotify_id TEXT NOT NULL UNIQUE,
    display_name TEXT,
    email TEXT,
    profile_image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Move existing Spotify data to new tables
INSERT INTO spotify_profiles (
    user_id,
    spotify_id,
    display_name,
    email,
    profile_image_url
)
SELECT 
    id,
    spotify_id,
    spotify_display_name,
    spotify_email,
    spotify_profile_image
FROM users
WHERE spotify_id IS NOT NULL;

INSERT INTO user_services (
    user_id,
    service
)
SELECT 
    id,
    'spotify'::service_type
FROM users
WHERE spotify_id IS NOT NULL;

-- Remove old columns from users table
ALTER TABLE users
    DROP COLUMN IF EXISTS spotify_id,
    DROP COLUMN IF EXISTS spotify_display_name,
    DROP COLUMN IF EXISTS spotify_email,
    DROP COLUMN IF EXISTS spotify_profile_image;

-- Add triggers for updated_at
CREATE TRIGGER update_user_services_updated_at
    BEFORE UPDATE ON user_services
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_spotify_profiles_updated_at
    BEFORE UPDATE ON spotify_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add indexes for common queries
CREATE INDEX idx_user_services_user_id ON user_services(user_id);
CREATE INDEX idx_user_services_service ON user_services(service);
CREATE INDEX idx_spotify_profiles_user_id ON spotify_profiles(user_id);
CREATE INDEX idx_spotify_profiles_spotify_id ON spotify_profiles(spotify_id); 