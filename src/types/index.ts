export interface Course {
  id: string;
  title: string;
  description: string;
  prompt: string;
  createdAt: Date;
  progress: number;
  lectures: Lecture[];
  quizzes: Quiz[];
  documentation: Documentation[];
}

export interface Lecture {
  id: string;
  title: string;
  content: string;
  duration: string;
  order: number;
  completed: boolean;
}

export interface Quiz {
  id: string;
  title: string;
  questions: Question[];
  score?: number;
  completed: boolean;
}

export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface Documentation {
  id: string;
  title: string;
  content: string;
  category: string;
  order: number;
}