ALTER TABLE transactions ADD COLUMN IF NOT EXISTS additional_discount NUMERIC(10, 2) DEFAULT 0;
