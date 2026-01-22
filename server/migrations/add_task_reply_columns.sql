-- Migration: Add task reply feature columns
-- Date: 2026-01-22
-- Description: Adds columns needed for task replies, assignments, and completion tracking

-- Add assigned_to column (stores user ID who the task is assigned to)
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS assigned_to INTEGER REFERENCES users(id);

-- Add assigned_by column (stores user ID who created/assigned the task)
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS assigned_by INTEGER REFERENCES users(id);

-- Add replies column (stores JSON array of task replies)
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS replies JSONB DEFAULT '[]'::jsonb;

-- Add completed_by column (stores user ID who marked task complete)
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS completed_by INTEGER REFERENCES users(id);

-- Add completed_at column (stores timestamp when task was completed)
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;

-- Add task_id column (unique task identifier like TASK-001)
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS task_id VARCHAR(50) UNIQUE;

-- Create index on assigned_to for faster queries
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);

-- Create index on assigned_by for faster queries
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_by ON tasks(assigned_by);

-- Create index on task_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_tasks_task_id ON tasks(task_id);

-- Update existing tasks to have task_id if they don't have one
UPDATE tasks 
SET task_id = 'TASK-' || LPAD(id::text, 4, '0')
WHERE task_id IS NULL;

COMMENT ON COLUMN tasks.assigned_to IS 'User ID of the person assigned to complete this task';
COMMENT ON COLUMN tasks.assigned_by IS 'User ID of the person who created/assigned this task';
COMMENT ON COLUMN tasks.replies IS 'JSON array of task replies with progress updates and attachments';
COMMENT ON COLUMN tasks.completed_by IS 'User ID of the person who marked this task as complete';
COMMENT ON COLUMN tasks.completed_at IS 'Timestamp when the task was marked as complete';
COMMENT ON COLUMN tasks.task_id IS 'Unique human-readable task identifier (e.g., TASK-0001)';
