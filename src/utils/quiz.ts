import { DEFAULT_EXAM_QUESTIONS } from "../constants/app";
import { AppStats, Question } from "../types";

export function calculateScore(
  questions: Question[],
  answers: Record<string, number>,
): number {
  return questions.reduce((acc: number, question: Question) => {
    return answers[question.id] === question.correctIndex ? acc + 1 : acc;
  }, 0);
}

export function clampQuestionCount(value: string, maxQuestions: number): number {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    return DEFAULT_EXAM_QUESTIONS;
  }

  return Math.max(1, Math.min(parsed, maxQuestions));
}

export function mergeFailedQuestionIds(
  existingFailedIds: string[],
  questions: Question[],
  answers: Record<string, number>,
): string[] {
  const updatedFailedIds = new Set(existingFailedIds);

  questions.forEach((question: Question) => {
    const selected = answers[question.id];
    if (selected === question.correctIndex) {
      updatedFailedIds.delete(question.id);
      return;
    }

    updatedFailedIds.add(question.id);
  });

  return Array.from(updatedFailedIds);
}

export function updateFailedIdsForPractice(
  existingFailedIds: string[],
  question: Question,
  isCorrect: boolean,
): string[] {
  const updatedFailedIds = new Set(existingFailedIds);
  if (isCorrect) {
    updatedFailedIds.delete(question.id);
  } else {
    updatedFailedIds.add(question.id);
  }

  return Array.from(updatedFailedIds);
}

export function buildExamStats(stats: AppStats, totalQuestions: number, score: number): AppStats {
  return {
    ...stats,
    totalAnswered: stats.totalAnswered + totalQuestions,
    totalCorrect: stats.totalCorrect + score,
    examsCompleted: stats.examsCompleted + 1,
  };
}

export function buildPracticeStats(stats: AppStats, isCorrect: boolean): AppStats {
  return {
    ...stats,
    totalAnswered: stats.totalAnswered + 1,
    totalCorrect: stats.totalCorrect + (isCorrect ? 1 : 0),
    practiceAnswered: stats.practiceAnswered + 1,
    practiceCorrect: stats.practiceCorrect + (isCorrect ? 1 : 0),
  };
}

export function getAccuracy(correct: number, total: number): string {
  if (total <= 0) {
    return "0.0";
  }

  return ((correct / total) * 100).toFixed(1);
}
