export type Question = {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  source?: string;
};

export type AppStats = {
  totalAnswered: number;
  totalCorrect: number;
  examsCompleted: number;
  practiceAnswered: number;
  practiceCorrect: number;
  lastExamDate?: number;
  sessionHistory?: SessionRecord[];
};

export type SessionRecord = {
  date: number;
  score: number;
  total: number;
  accuracy: number;
};

export type QuestionStat = {
  id: string;
  timesShown: number;
  timesCorrect: number;
  timesFailed: number;
};
