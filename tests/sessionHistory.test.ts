import test from "node:test";
import assert from "node:assert/strict";
import { buildRecordedExamSessionStats } from "../src/utils/sessionHistory";
import { AppStats } from "../src/types";

const baseStats: AppStats = {
  totalAnswered: 12,
  totalCorrect: 8,
  examsCompleted: 2,
  practiceAnswered: 7,
  practiceCorrect: 5,
  sessionHistory: [],
};

test("buildRecordedExamSessionStats appends a session with answered-based accuracy", () => {
  const now = 1710000000000;
  const updated = buildRecordedExamSessionStats(baseStats, 15, 30, 20, now);

  assert.equal(updated.lastExamDate, now);
  assert.equal(updated.sessionHistory?.length, 1);
  assert.deepEqual(updated.sessionHistory?.[0], {
    date: now,
    score: 15,
    total: 30,
    accuracy: 75,
  });
});

test("buildRecordedExamSessionStats keeps only the last 50 sessions", () => {
  const withHistory: AppStats = {
    ...baseStats,
    sessionHistory: Array.from({ length: 50 }).map((_, idx) => ({
      date: idx + 1,
      score: 10,
      total: 20,
      accuracy: 50,
    })),
  };

  const updated = buildRecordedExamSessionStats(withHistory, 16, 20, 20, 999);
  assert.equal(updated.sessionHistory?.length, 50);
  assert.equal(updated.sessionHistory?.[0].date, 2);
  assert.equal(updated.sessionHistory?.[49].date, 999);
});
