import assert from "node:assert/strict";
import { test } from "node:test";
import { cached, clearCache } from "./cache.ts";

test("a second call inside the ttl reuses the first result", async () => {
  clearCache();
  let calls = 0;
  const load = async () => ++calls;
  assert.equal(await cached("k", 1000, load), 1);
  assert.equal(await cached("k", 1000, load), 1);
  assert.equal(calls, 1);
});

test("concurrent callers share one request", async () => {
  clearCache();
  let calls = 0;
  const load = async () => ++calls;
  await Promise.all([cached("k", 1000, load), cached("k", 1000, load)]);
  assert.equal(calls, 1);
});

test("a failed load is not cached", async () => {
  clearCache();
  await assert.rejects(cached("k", 1000, () => Promise.reject(new Error("offline"))));
  await new Promise((r) => setTimeout(r, 0)); // let the eviction handler run
  assert.equal(await cached("k", 1000, async () => "ok"), "ok");
});

test("an expired entry is loaded again", async () => {
  clearCache();
  let calls = 0;
  const load = async () => ++calls;
  await cached("k", 0, load);
  await cached("k", 0, load);
  assert.equal(calls, 2);
});

test("clearCache only drops the matching prefix", async () => {
  clearCache();
  let a = 0;
  let b = 0;
  await cached("popular", 1000, async () => ++a);
  await cached("search:x", 1000, async () => ++b);
  clearCache("popular");
  await cached("popular", 1000, async () => ++a);
  await cached("search:x", 1000, async () => ++b);
  assert.deepEqual([a, b], [2, 1]);
});
