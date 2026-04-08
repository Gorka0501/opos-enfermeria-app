import { AppStats, SessionRecord } from "../types";

/**
 * Appends one exam session record to stats.sessionHistory.
 *
 * Accuracy denominator uses answeredCount when provided, allowing
 * unfinished-answer exams to keep fair percentage semantics.
 */
export function buildRecordedExamSessionStats(
  stats: AppStats,
  score: number,
  total: number,
  answeredCount?: number,
  now: number = Date.now(),
): AppStats {
  const denominator = answeredCount ?? total;
  const accuracy = denominator > 0 ? Math.round((score / denominator) * 100) : 0;

  const newSession: SessionRecord = {
    date: now,
    score,
    total,
    accuracy,
  };

  const history = stats.sessionHistory || [];
  return {
    ...stats,
    lastExamDate: now,
    sessionHistory: [...history, newSession].slice(-50),
  };
}
