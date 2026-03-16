import React from 'react';
import { GraduationCap } from '@/components/common/icons';

export const MOCK_INTERVIEW_VISA_TYPES: VisaType[] = [
  'F-1', 'F-2', 'F-3',
  'J-1', 'J-2',
  'B-1', 'B-2'
];

export const MOCK_INTERVIEW_CATEGORIES: QuestionCategory[] = [
  'Study', 'Finances', 'Ties', 'Post-Graduation Plans', 'General'
];

export const MOCK_INTERVIEW_DIFFICULTIES: Difficulty[] = [
  'easy', 'medium', 'hard'
];

export const DEFAULT_QUESTION_SCORES = {
  context: 0,
  body_language: 0,
  fluency: 0,
  grammar: 0
};

export const VERDICT_THRESHOLDS = {
  approved: 3.5,
  rejected: 2.5,
  reviewRequired: 2.5
};

export const calculateVerdict = (average: number): { verdict: 'Approved' | 'Rejected' | 'Review Required'; suggested: string } => {
  if (average >= VERDICT_THRESHOLDS.approved) {
    return {
      verdict: 'Approved',
      suggested: 'Student is ready for the actual interview.'
    };
  } else if (average < VERDICT_THRESHOLDS.rejected) {
    return {
      verdict: 'Rejected',
      suggested: 'Student needs significant improvement before next attempt.'
    };
  } else {
    return {
      verdict: 'Review Required',
      suggested: 'Student shows promise but needs more practice.'
    };
  }
};

export const calculateAverageScores = (questions: any[]): any => {
  if (questions.length === 0) return null;

  const sums = questions.reduce((acc, q) => ({
    context: acc.context + (q.scores?.context || 0),
    body_language: acc.body_language + (q.scores?.body_language || 0),
    fluency: acc.fluency + (q.scores?.fluency || 0),
    grammar: acc.grammar + (q.scores?.grammar || 0)
  }), { context: 0, body_language: 0, fluency: 0, grammar: 0 });

  const count = questions.length;

  return {
    context: parseFloat((sums.context / count).toFixed(2)),
    body_language: parseFloat((sums.body_language / count).toFixed(2)),
    fluency: parseFloat((sums.fluency / count).toFixed(2)),
    grammar: parseFloat((sums.grammar / count).toFixed(2))
  };
};

export const calculateOverallAverage = (averageScores: any): number => {
  if (!averageScores) return 0;

  const sum = averageScores.context + averageScores.body_language +
              averageScores.fluency + averageScores.grammar;
  return parseFloat((sum / 4).toFixed(2));
};
