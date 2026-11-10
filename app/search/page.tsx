"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import BottleRow from "@/components/BottleRow";
import PageHeader, { DemoNote } from "@/components/PageHeader";
import Scanner from "@/components/Scanner";
import { bottlesByEan, popularBottles, recentBottles, rememberBottle, searchBottles } from "@/lib/data";
import type { Bottle, Source } from "@/lib/types";

type Scan = { ean: string; matches: Bottle[] };

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [found, setFound] = useState<{ q: string; items: Bottle[] } | null>(null);
  const [popular, setPopular] = useState<Bottle[]>([]);
  const [recent, setRecent] = useState<Bottle[]>([]);
  const [scanning, setScanning] = useState(false);
  const [scan, setScan] = useState<Scan | null>(null);
  const [source, setSource] = useState<Source>("live");
  const inputRef = useRef<HTMLInputElement>(null);
  const requestId = useRef(0);

  useEffect(() => {
    // Recents live in localStorage, so they can only be read after mount
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRecent(recentBottles());
    popularBottles().then(({ data, source }) => {
      setPopular(data);
      setSource(source);
    });
  }, []);

  // Typo-tolerant search (pg_trgm), debounced, with a guard so a slow reply never overwrites a newer one
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return;
    const id = ++requestId.current;
    const timer = setTimeout(async () => {
      const { data, source } = await searchBottles(q);
      if (id !== requestId.current) return;
      setFound({ q, items: data });
      setSource(source);
    }, 180);
    return () => clearTimeout(timer);
  }, [query]);

  async function handleScan(ean: string) {
    setScanning(false);
    const { data } = await bottlesByEan(ean);
    setScan({ ean, matches: data });
    setQuery("");
    if (data.length === 0) inputRef.current?.focus();
  }

  function choose(bottle: Bottle) {
    rememberBottle(bottle);
    const params = new URLSearchParams({ b: bottle.id });
    if (scan) params.set("ean", scan.ean);
    router.push(`/checkin?${params}`);
  }

  const typed = query.trim().length >= 2;
  const results = typed && found ? found.items : [];
  const searching = typed && found?.q !== query.trim();
  const showScanMatches = scan && scan.matches.length > 0 && !typed;

  return (
    <>
      <PageHeader title="Find a bottle" />
      {source === "demo" && <DemoNote />}

      <div className="flex gap-2 px-4 pt-4">
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Producer or cuvée"
          aria-label="Search bottles"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          className="field"
        />
        <button
          type="button"
          onClick={() => setScanning(true)}
          aria-label="Scan a barcode"
          className="btn btn-quiet press w-12 shrink-0 !px-0"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden>
            <path d="M4 5v14M7.5 5v14M11 5v14M14 5v14M17 5v14M20 5v14" strokeWidth="1.4" />
          </svg>
        </button>
      </div>

      {scan && (
        <div className="mx-4 mt-3 border-l-2 border-brand-primary bg-badge-bg px-3 py-2 text-[13px] leading-snug">
          {scan.matches.length > 0 ? (
            <>
              Barcode <span className="tabular-nums">{scan.ean}</span> matches
              {scan.matches.length === 1 ? " this bottle." : " these bottles. Pick yours."}
            </>
          ) : (
            <>
              Barcode <span className="tabular-nums">{scan.ean}</span> is not linked to a bottle yet.
              Find it by name and we will remember it for the next person.
            </>
          )}
        </div>
      )}

      <div className="mt-2">
        {typed ? (
          <>
            {results.length > 0 && (
              <ul>
                {results.map((b) => (
                  <BottleRow key={b.id} bottle={b} onSelect={choose} />
                ))}
              </ul>
            )}
            {results.length === 0 && !searching && (
              <div className="px-4 py-12 text-center">
                <p className="font-display text-[20px]">No match for “{query.trim()}”</p>
                <p className="mt-1 text-sm text-text-muted">
                  Try the producer on its own, or fewer words.
                </p>
              </div>
            )}
          </>
        ) : showScanMatches ? (
          <ul>
            {scan.matches.map((b) => (
              <BottleRow key={b.id} bottle={b} onSelect={choose} />
            ))}
          </ul>
        ) : (
          <>
            {recent.length > 0 && (
              <section>
                <h2 className="eyebrow px-4 pt-4 pb-2">Recent</h2>
                <ul className="border-t border-border">
                  {recent.map((b) => (
                    <BottleRow key={b.id} bottle={b} onSelect={choose} />
                  ))}
                </ul>
              </section>
            )}
            {popular.length > 0 && (
              <section>
                <h2 className="eyebrow px-4 pt-4 pb-2">Popular</h2>
                <ul className="border-t border-border">
                  {popular.map((b) => (
                    <BottleRow key={b.id} bottle={b} onSelect={choose} />
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
      </div>

      {scanning && <Scanner onDetect={handleScan} onClose={() => setScanning(false)} />}
    </>
  );
}
