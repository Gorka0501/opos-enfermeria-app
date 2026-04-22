import test from "node:test";
import assert from "node:assert/strict";
import {
  buildRecordedExamSessionStats,
  buildRecordedExamSessionStatsForProfile,
  getExamHistoryForProfile,
} from "../src/utils/sessionHistory";
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

test("buildRecordedExamSessionStatsForProfile keeps only latest 5 per profile", () => {
  let updated: AppStats = { ...baseStats, examHistoryByProfile: {} };

  for (let idx = 0; idx < 7; idx++) {
    updated = buildRecordedExamSessionStatsForProfile(
      updated,
      "enfermeria",
      20 + idx,
      30,
      [
        {
          id: `Q_${idx}`,
          question: "Pregunta",
          options: ["A", "B", "C", "D"],
          correctIndex: 1,
        },
      ],
      { [`Q_${idx}`]: 1 },
      30,
      idx + 1,
    );
  }

  const history = getExamHistoryForProfile(updated, "enfermeria");
  assert.equal(history.length, 5);
  assert.equal(history[0].date, 7);
  assert.equal(history[4].date, 3);
});

test("getExamHistoryForProfile returns independent history per profile", () => {
  let updated: AppStats = { ...baseStats, examHistoryByProfile: {} };

  updated = buildRecordedExamSessionStatsForProfile(
    updated,
    "enfermeria",
    18,
    30,
    [
      {
        id: "ENF_1",
        question: "Pregunta",
        options: ["A", "B", "C", "D"],
        correctIndex: 0,
      },
    ],
    { ENF_1: 0 },
    30,
    100,
  );

  updated = buildRecordedExamSessionStatsForProfile(
    updated,
    "celador",
    11,
    20,
    [
      {
        id: "CEL_1",
        question: "Pregunta",
        options: ["A", "B", "C", "D"],
        correctIndex: 2,
      },
    ],
    { CEL_1: 2 },
    20,
    101,
  );

  const enfermeriaHistory = getExamHistoryForProfile(updated, "enfermeria");
  const celadorHistory = getExamHistoryForProfile(updated, "celador");

  assert.equal(enfermeriaHistory.length, 1);
  assert.equal(celadorHistory.length, 1);
  assert.equal(enfermeriaHistory[0].questions[0].id, "ENF_1");
  assert.equal(celadorHistory[0].questions[0].id, "CEL_1");
});
