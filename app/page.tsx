"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import FeedCard from "@/components/FeedCard";
import PageHeader, { DemoNote } from "@/components/PageHeader";
import { fetchFeed } from "@/lib/data";
import type { FeedItem, Source } from "@/lib/types";

export default function FeedPage() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState<Source>("live");
  const [error, setError] = useState(false);
  const busy = useRef(false);
  const sentinel = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async (from: string | null) => {
    if (busy.current) return;
    busy.current = true;
    setLoading(true);
    setError(false);
    try {
      const { data, source } = await fetchFeed(from);
      setItems((prev) => (from ? [...prev, ...data.items] : data.items));
      setCursor(data.nextCursor);
      setDone(data.nextCursor === null);
      setSource(source);
    } catch {
      setError(true);
    } finally {
      busy.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Fetching the first page on mount is a genuine effect
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadMore(null);
  }, [loadMore]);

  // Load the next page shortly before the reader reaches the end
  useEffect(() => {
    const el = sentinel.current;
    if (!el || done || items.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && cursor) loadMore(cursor);
      },
      { rootMargin: "400px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [cursor, done, items.length, loadMore]);

  return (
    <>
      <PageHeader
        title="Bubbles"
        right={
          <Link href="/search" className="btn btn-gold press min-h-11 !px-4">
            Check in
          </Link>
        }
      />

      {source === "demo" && <DemoNote />}

      {items.map((item, i) => (
        <FeedCard key={item.id} item={item} index={i} />
      ))}

      {items.length === 0 && !loading && !error && (
        <div className="px-4 py-16 text-center">
          <p className="font-display text-[22px]">Nothing poured yet</p>
          <p className="mt-1 text-sm text-text-muted">Be the first to log a bottle.</p>
        </div>
      )}

      {error && (
        <div className="px-4 py-8 text-center">
          <p className="text-sm text-text-muted">The feed could not load.</p>
          <button type="button" onClick={() => loadMore(cursor)} className="btn btn-quiet press mt-3">
            Try again
          </button>
        </div>
      )}

      <div ref={sentinel} className="h-px" />

      {loading && <p className="py-8 text-center text-xs uppercase tracking-[0.14em] text-text-muted">Pouring…</p>}
      {done && items.length > 0 && (
        <p className="py-8 text-center text-xs uppercase tracking-[0.14em] text-text-muted">You are up to date</p>
      )}
    </>
  );
}
