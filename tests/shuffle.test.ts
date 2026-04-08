import test from "node:test";
import assert from "node:assert/strict";
import { pickSemiRandomQuestions } from "../src/utils/shuffle";

test("pickSemiRandomQuestions returns requested count without duplicates", () => {
  const pool = Array.from({ length: 20 }).map((_, idx) => ({ id: `Q${idx + 1}` }));
  const picked = pickSemiRandomQuestions(pool, 8, {}, []);

  assert.equal(picked.length, 8);
  assert.equal(new Set(picked.map((q) => q.id)).size, 8);
});

test("pickSemiRandomQuestions returns full shuffled pool when count >= pool", () => {
  const pool = [{ id: "A" }, { id: "B" }, { id: "C" }];
  const picked = pickSemiRandomQuestions(pool, 3, {}, []);

  assert.equal(picked.length, 3);
  assert.deepEqual(new Set(picked.map((q) => q.id)), new Set(["A", "B", "C"]));
});
