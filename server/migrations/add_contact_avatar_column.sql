-- Migration: Add avatar_url column to contacts table
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS avatar_data BYTEA;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS avatar_mimetype TEXT;
