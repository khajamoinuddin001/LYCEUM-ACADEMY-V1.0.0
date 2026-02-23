ALTER TABLE university_courses ADD COLUMN IF NOT EXISTS application_fee VARCHAR(255);
ALTER TABLE university_courses ADD COLUMN IF NOT EXISTS enrollment_deposit VARCHAR(255);
ALTER TABLE university_courses ADD COLUMN IF NOT EXISTS wes_requirement VARCHAR(255);
