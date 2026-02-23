CREATE TABLE IF NOT EXISTS university_courses (
  id SERIAL PRIMARY KEY,
  university_name TEXT NOT NULL,
  country TEXT NOT NULL,
  course_name TEXT NOT NULL,
  intake TEXT NOT NULL,
  min_ssc_percent NUMERIC NOT NULL,
  min_inter_percent NUMERIC NOT NULL,
  min_degree_percent NUMERIC,
  required_exam TEXT,
  min_exam_score NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
