// Type definitions for Mock Interview feature

export type VisaType = 'F-1' | 'F-2' | 'F-3' | 'J-1' | 'J-2' | 'B-1' | 'B-2' | 'Student Visa' | 'Other';

export type QuestionCategory = 'Study' | 'Finances' | 'Ties' | 'Post-Graduation Plans' | 'General';

export type Difficulty = 'easy' | 'medium' | 'hard';

export type Question = {
  id: string;
  question_text: string;
  category: QuestionCategory;
  difficulty: Difficulty;
};

export type QuestionWithScores = Question & {
  notes?: string;
  scores?: {
    context: number;
    fluency: number;
    grammar: number;
    body_language: number;
  };
  is_correct?: boolean;
};

export type MockInterviewSession = {
  id: string;
  attempt_number?: number;
  student_id: number;
  student_name?: string;
  visa_type: VisaType;
  session_date: string;
  counsellor_id: number;
  session_notes?: string;
  questions: QuestionWithScores[];
  questions_count: number;
  correct_count?: number;
  incorrect_count?: number;
  average_scores: {
    context: number;
    body_language: number;
    fluency: number;
    grammar: number;
  };
  overall_average: number;
  verdict: string;
  counsellor_override?: boolean;
  overall_comments?: string;
  ai_feedback?: string;
  created_at?: string;
};

// Alias for backward compatibility
export type InterviewSession = MockInterviewSession;

export type QuestionTemplate = {
  id: string;
  name: string;
  description?: string;
  difficulty: Difficulty;
  visa_types: VisaType[];
  questions: Question[];
  created_at: string;
  updated_at?: string;
};
