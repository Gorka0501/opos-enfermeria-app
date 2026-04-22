import { ProfileId } from "../constants/profiles";
import { AppStats, ProfileExamSessionRecord, Question, SessionRecord } from "../types";

const MAX_GLOBAL_EXAM_HISTORY = 50;
const MAX_PROFILE_EXAM_HISTORY = 5;

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
    sessionHistory: [...history, newSession].slice(-MAX_GLOBAL_EXAM_HISTORY),
  };
}

export function getExamHistoryForProfile(
  stats: AppStats,
  profileId: ProfileId,
): ProfileExamSessionRecord[] {
  const byProfile = stats.examHistoryByProfile?.[profileId];
  if (!Array.isArray(byProfile)) {
    return [];
  }

  return byProfile
    .filter(
      (session) =>
        typeof session?.date === "number" &&
        typeof session?.score === "number" &&
        typeof session?.total === "number" &&
        typeof session?.accuracy === "number" &&
        Array.isArray(session?.questions) &&
        session?.answers &&
        typeof session.answers === "object",
    )
    .sort((left, right) => right.date - left.date)
    .slice(0, MAX_PROFILE_EXAM_HISTORY);
}

/**
 * Appends one exam session to profile history, keeping only the latest 5 entries.
 *
 * Also keeps legacy sessionHistory updated for backward compatible analytics.
 */
export function buildRecordedExamSessionStatsForProfile(
  stats: AppStats,
  profileId: ProfileId,
  score: number,
  total: number,
  questions: Question[],
  answers: Record<string, number>,
  answeredCount?: number,
  now: number = Date.now(),
): AppStats {
  const withLegacyHistory = buildRecordedExamSessionStats(stats, score, total, answeredCount, now);
  const denominator = answeredCount ?? total;
  const accuracy = denominator > 0 ? Math.round((score / denominator) * 100) : 0;

  const profileSession: ProfileExamSessionRecord = {
    date: now,
    score,
    total,
    accuracy,
    questions,
    answers,
  };

  const previousByProfile = withLegacyHistory.examHistoryByProfile ?? {};
  const previousProfileHistory = Array.isArray(previousByProfile[profileId]) ? previousByProfile[profileId] : [];
  const merged = [...previousProfileHistory, profileSession]
    .sort((left, right) => right.date - left.date)
    .slice(0, MAX_PROFILE_EXAM_HISTORY);

  return {
    ...withLegacyHistory,
    examHistoryByProfile: {
      ...previousByProfile,
      [profileId]: merged,
    },
  };
}
