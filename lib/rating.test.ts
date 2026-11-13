import assert from "node:assert/strict";
import { test } from "node:test";
import { RATING_MAX, RATING_STEP, formatRating } from "./rating.ts";

test("formatRating keeps one decimal unless a quarter needs two", () => {
  assert.equal(formatRating(4), "4.0");
  assert.equal(formatRating(4.5), "4.5");
  assert.equal(formatRating(4.25), "4.25");
  assert.equal(formatRating(0.75), "0.75");
  assert.equal(formatRating(5), "5.0");
});

test("every slider step is a value the database check accepts", () => {
  for (let v = RATING_STEP; v <= RATING_MAX; v += RATING_STEP) {
    assert.equal(v * 4, Math.trunc(v * 4)); // rating * 4 = trunc(rating * 4)
  }
});
