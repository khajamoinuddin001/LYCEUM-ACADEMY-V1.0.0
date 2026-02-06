-- Comprehensive migration to support the redesigned Support Ticket system
-- This script ensures all necessary tables and columns exist.

-- 1. Create tickets table if it doesn't exist
CREATE TABLE IF NOT EXISTS tickets (
    id SERIAL PRIMARY KEY,
    ticket_id TEXT UNIQUE NOT NULL,
    contact_id INTEGER REFERENCES contacts(id),
    subject TEXT NOT NULL,
    description TEXT,
    priority TEXT DEFAULT 'Medium',
    assigned_to INTEGER REFERENCES users(id),
    created_by INTEGER REFERENCES users(id),
    status TEXT DEFAULT 'Open',
    resolution_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Add resolution_notes column to tickets if it's missing
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tickets' AND column_name='resolution_notes') THEN
        ALTER TABLE tickets ADD COLUMN resolution_notes TEXT;
    END IF;
END $$;

-- 3. Create ticket_attachments table if it doesn't exist
CREATE TABLE IF NOT EXISTS ticket_attachments (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER REFERENCES tickets(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    content_type TEXT,
    file_data BYTEA,
    file_size INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create ticket_messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS ticket_messages (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER REFERENCES tickets(id) ON DELETE CASCADE,
    sender_id INTEGER REFERENCES users(id),
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Add ticket_id and other missing columns to tasks table
DO $$ 
BEGIN 
    -- Add ticket_id for linking tickets to tasks
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='ticket_id') THEN
        ALTER TABLE tasks ADD COLUMN ticket_id INTEGER REFERENCES tickets(id) ON DELETE SET NULL;
    END IF;
    
    -- Add visibility flag for students
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='is_visible_to_student') THEN
        ALTER TABLE tasks ADD COLUMN is_visible_to_student BOOLEAN DEFAULT FALSE;
    END IF;

    -- Add activity type for categorization
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='activity_type') THEN
        ALTER TABLE tasks ADD COLUMN activity_type TEXT;
    END IF;
END $$;

-- 6. Add performance indexes
CREATE INDEX IF NOT EXISTS idx_tickets_contact_id ON tickets(contact_id);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_to ON tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_ticket_attachments_ticket_id ON ticket_attachments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket_id ON ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_tasks_ticket_id ON tasks(ticket_id);
