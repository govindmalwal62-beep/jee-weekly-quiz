export type SubjectType = 'physics' | 'chemistry' | 'maths';

export interface Question {
  id: string;
  subject: SubjectType;
  year: string;
  text: string;
  options: [string, string, string, string]; // exactly 4 options
  correctAnswer: number; // 0 for A, 1 for B, 2 for C, 3 for D
  explanation?: string;
}

export interface QuizState {
  questions: Question[];
  selectedAnswers: Record<string, number>; // questionId -> selected option indices (0-3)
  section: SubjectType;
  currentQuestionIndex: Record<SubjectType, number>; // index of current question in each subject
  timeRemaining: number; // in seconds
  isSubmitted: boolean;
  isStarted: boolean;
}

export interface AdminSettings {
  adminPassword: string;
  examDurationMinutes: number;
}

export interface AnalyticsSummary {
  totalScore: number;
  correctCount: number;
  wrongCount: number;
  unattemptedCount: number;
  percentage: number;
  accuracyRate: number;
  rankLabel: 'Excellent' | 'Very Good' | 'Average' | 'Needs Improvement';
  sectionPerformance: Record<SubjectType, {
    total: number;
    attempted: number;
    correct: number;
    score: number;
  }>;
}
