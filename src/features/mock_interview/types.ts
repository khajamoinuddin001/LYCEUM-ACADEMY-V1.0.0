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

export type QuestionTemplate = {
  id: string;
  name: string;
  description?: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  visa_types: VisaType[];
  questions: Question[];
  created_at: string;
  updated_at?: string;
};
