type Entry = { at: number; value: Promise<unknown> };

const store = new Map<string, Entry>();
const MAX_ENTRIES = 200;

/**
 * Remember an async result for `ttlMs`. The promise itself is stored, so two callers
 * asking at once share one request. A rejected load is dropped, so it is retried next time.
 * shortcut: in-memory per tab (lost on reload), enough for search-as-you-type; move to
 * sessionStorage or an edge cache if cold-start latency starts to matter.
 */
export function cached<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
  const hit = store.get(key);
  if (hit && Date.now() - hit.at < ttlMs) return hit.value as Promise<T>;

  const value = load();
  const entry = { at: Date.now(), value };
  store.set(key, entry);
  value.catch(() => {
    if (store.get(key) === entry) store.delete(key);
  });
  if (store.size > MAX_ENTRIES) store.delete(store.keys().next().value as string);
  return value;
}

/** Drop every entry whose key starts with `prefix` (all of them when empty). */
export function clearCache(prefix = "") {
  for (const key of store.keys()) if (key.startsWith(prefix)) store.delete(key);
}
