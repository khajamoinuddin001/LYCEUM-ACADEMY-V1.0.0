-- Migration to add counselor_assigned_2 to contacts table
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='counselor_assigned_2') THEN
        ALTER TABLE contacts ADD COLUMN counselor_assigned_2 TEXT;
    END IF;
END $$;
