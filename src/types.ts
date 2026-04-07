export type Question = {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
};

export type QuizMode = "random" | "failed";

export type AppStats = {
  totalAnswered: number;
  totalCorrect: number;
  examsCompleted: number;
  practiceAnswered: number;
  practiceCorrect: number;
};
