import { DEFAULT_EXAM_QUESTIONS } from "../constants/app";
import { AppStats, Question } from "../types";

/**
 * Pure quiz/business helpers.
 *
 * This module intentionally avoids side effects and storage access,
 * so behavior is predictable and easy to unit test.
 */

/** Calculates number of correct answers for a given question set. */
export function calculateScore(
  questions: Question[],
  answers: Record<string, number>,
): number {
  return questions.reduce((acc: number, question: Question) => {
    return answers[question.id] === question.correctIndex ? acc + 1 : acc;
  }, 0);
}

/**
 * Parses and clamps exam size input to [1, maxQuestions].
 * Falls back to DEFAULT_EXAM_QUESTIONS for invalid input.
 */
export function clampQuestionCount(value: string, maxQuestions: number): number {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    return DEFAULT_EXAM_QUESTIONS;
  }

  return Math.max(1, Math.min(parsed, maxQuestions));
}

/**
 * Merges current exam answers into the persisted failed IDs set.
 *
 * Rules:
 * - Correct answer removes ID from failed set.
 * - Wrong answer adds ID.
 * - Unanswered question is ignored (no add/remove).
 */
export function mergeFailedQuestionIds(
  existingFailedIds: string[],
  questions: Question[],
  answers: Record<string, number>,
): string[] {
  const updatedFailedIds = new Set(existingFailedIds);

  questions.forEach((question: Question) => {
    const selected = answers[question.id];
    if (selected === undefined) {
      // Unanswered exam questions are shown as wrong in review UI,
      // but should not affect persistent failed-question tracking.
      return;
    }

    if (selected === question.correctIndex) {
      updatedFailedIds.delete(question.id);
      return;
    }

    updatedFailedIds.add(question.id);
  });

  return Array.from(updatedFailedIds);
}

/** Applies one practice answer result to failed IDs set. */
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

/** Builds updated global exam stats after one finished exam. */
export function buildExamStats(stats: AppStats, answeredCount: number, score: number): AppStats {
  return {
    ...stats,
    totalAnswered: stats.totalAnswered + answeredCount,
    totalCorrect: stats.totalCorrect + score,
    examsCompleted: stats.examsCompleted + 1,
  };
}

/** Builds updated stats after one answered practice question. */
export function buildPracticeStats(stats: AppStats, isCorrect: boolean): AppStats {
  return {
    ...stats,
    totalAnswered: stats.totalAnswered + 1,
    totalCorrect: stats.totalCorrect + (isCorrect ? 1 : 0),
    practiceAnswered: stats.practiceAnswered + 1,
    practiceCorrect: stats.practiceCorrect + (isCorrect ? 1 : 0),
  };
}

/** Formats correctness ratio as one-decimal percentage string. */
export function getAccuracy(correct: number, total: number): string {
  if (total <= 0) {
    return "0.0";
  }

  return ((correct / total) * 100).toFixed(1);
}
