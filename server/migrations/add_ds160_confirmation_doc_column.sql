ALTER TABLE visa_operations 
ADD COLUMN IF NOT EXISTS confirmation_document_id INTEGER REFERENCES visa_operation_items(id) ON DELETE SET NULL;
