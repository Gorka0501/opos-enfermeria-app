import test from "node:test";
import assert from "node:assert/strict";
import {
  applyCorrectAnswerOverrides,
  buildExamStats,
  buildPracticeStats,
  calculateScore,
  clampQuestionCount,
  getAccuracy,
  mergeFailedQuestionIds,
  updateFailedIdsForPractice,
} from "../src/utils/quiz";
import { AppStats, Question } from "../src/types";

const sampleQuestions: Question[] = [
  {
    id: "Q1",
    question: "Pregunta 1",
    options: ["A", "B", "C", "D"],
    correctIndex: 1,
  },
  {
    id: "Q2",
    question: "Pregunta 2",
    options: ["A", "B", "C", "D"],
    correctIndex: 2,
  },
];

const baseStats: AppStats = {
  totalAnswered: 10,
  totalCorrect: 7,
  examsCompleted: 2,
  practiceAnswered: 6,
  practiceCorrect: 4,
};

test("calculateScore counts only correct answers", () => {
  const answers = { Q1: 1, Q2: 0 };

  assert.equal(calculateScore(sampleQuestions, answers), 1);
});

test("clampQuestionCount returns default for invalid input", () => {
  assert.equal(clampQuestionCount("abc", 700), 30);
});

test("clampQuestionCount respects lower and upper bounds", () => {
  assert.equal(clampQuestionCount("0", 700), 1);
  assert.equal(clampQuestionCount("999", 700), 700);
  assert.equal(clampQuestionCount("25", 700), 25);
});

test("mergeFailedQuestionIds removes corrected items and adds failed ones", () => {
  const existingFailed = ["Q1"];
  const answers = { Q1: 1, Q2: 0 };

  const result = mergeFailedQuestionIds(existingFailed, sampleQuestions, answers);

  assert.deepEqual(result.sort(), ["Q2"]);
});

test("updateFailedIdsForPractice removes a question when answered correctly", () => {
  const result = updateFailedIdsForPractice(["Q1", "Q2"], sampleQuestions[0], true);

  assert.deepEqual(result.sort(), ["Q2"]);
});

test("updateFailedIdsForPractice adds a question when answered incorrectly", () => {
  const result = updateFailedIdsForPractice([], sampleQuestions[1], false);

  assert.deepEqual(result, ["Q2"]);
});

test("applyCorrectAnswerOverrides replaces the correct answer index when override is valid", () => {
  const result = applyCorrectAnswerOverrides(sampleQuestions, { Q1: 3 });

  assert.equal(result[0].correctIndex, 3);
  assert.equal(result[1].correctIndex, 2);
});

test("applyCorrectAnswerOverrides ignores invalid override indexes", () => {
  const result = applyCorrectAnswerOverrides(sampleQuestions, { Q1: 99, Q2: -1 });

  assert.equal(result[0].correctIndex, 1);
  assert.equal(result[1].correctIndex, 2);
});

test("buildExamStats increments exam totals", () => {
  const result = buildExamStats(baseStats, 30, 24);

  assert.deepEqual(result, {
    totalAnswered: 40,
    totalCorrect: 31,
    examsCompleted: 3,
    practiceAnswered: 6,
    practiceCorrect: 4,
  });
});

test("buildPracticeStats increments practice and global totals", () => {
  const result = buildPracticeStats(baseStats, true);

  assert.deepEqual(result, {
    totalAnswered: 11,
    totalCorrect: 8,
    examsCompleted: 2,
    practiceAnswered: 7,
    practiceCorrect: 5,
  });
});

test("getAccuracy formats percentages with one decimal", () => {
  assert.equal(getAccuracy(0, 0), "0.0");
  assert.equal(getAccuracy(3, 4), "75.0");
});
