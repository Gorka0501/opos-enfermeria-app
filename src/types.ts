import type { ProfileId } from "./constants/profiles";

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
  examHistoryByProfile?: Partial<Record<ProfileId, ProfileExamSessionRecord[]>>;
};

export type SessionRecord = {
  date: number;
  score: number;
  total: number;
  accuracy: number;
};

export type ProfileExamSessionRecord = SessionRecord & {
  questions: Question[];
  answers: Record<string, number>;
};

export type QuestionStat = {
  id: string;
  timesShown: number;
  timesCorrect: number;
  timesFailed: number;
};
