"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import PhotoPicker from "@/components/PhotoPicker";
import { StarInput } from "@/components/Stars";
import { NotSignedInError, getBottle, submitCheckIn } from "@/lib/data";
import { useSession } from "@/lib/session";
import { DOSAGES, type Bottle, type Dosage, type PhotoPair } from "@/lib/types";

function Section({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-border px-4 py-5">
      <h2 className="eyebrow mb-3">
        <span className="mr-2 text-brand-hover">{n}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function CheckInForm() {
  const router = useRouter();
  const params = useSearchParams();
  const bottleId = params.get("b");
  const ean = params.get("ean");
  const { user, loading: sessionLoading, demo } = useSession();

  const [fetched, setFetched] = useState<Bottle | null | undefined>(undefined);
  const bottle = bottleId ? fetched : null;
  const [vintage, setVintage] = useState("NV");
  const [rating, setRating] = useState(0);
  const [dosage, setDosage] = useState<Dosage | null>(null);
  const [note, setNote] = useState("");
  const [venue, setVenue] = useState("");
  const [photos, setPhotos] = useState<PhotoPair | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (bottleId) getBottle(bottleId).then(setFetched);
  }, [bottleId]);

  const thisYear = new Date().getFullYear();
  const years = Array.from({ length: thisYear - 1949 }, (_, i) => thisYear - i);
  const canPost = demo || !!user;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!bottle) return;
    if (rating === 0) {
      setError("Give it a rating first.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await submitCheckIn({
        bottle,
        vintage: vintage === "NV" ? null : Number(vintage),
        rating,
        dosage,
        note,
        venue,
        photos,
        ean,
      });
      router.push("/");
    } catch (err) {
      setError(
        err instanceof NotSignedInError
          ? err.message
          : "That did not go through. Check your connection and try again.",
      );
      setSubmitting(false);
    }
  }

  if (bottle === undefined) {
    return (
      <>
        <PageHeader title="Check in" />
        <p className="px-4 py-12 text-center text-sm text-text-muted">Loading…</p>
      </>
    );
  }

  if (bottle === null) {
    return (
      <>
        <PageHeader title="Check in" />
        <div className="px-4 py-16 text-center">
          <p className="font-display text-[22px]">We could not find that bottle</p>
          <Link href="/search" className="btn btn-primary press mt-5">
            Search again
          </Link>
        </div>
      </>
    );
  }

  return (
    <form onSubmit={submit}>
      <PageHeader title="Check in" />

      <div className="flex items-start gap-3 border-b border-border px-4 py-5">
        <div className="min-w-0 flex-1">
          <p className="eyebrow truncate">{bottle.producer}</p>
          <p className="mt-1 font-display text-[26px] leading-[1.15] tracking-[-0.01em]">{bottle.name}</p>
          <p className="mt-1 text-[13px] text-text-muted">{bottle.category}</p>
        </div>
        <Link href="/search" className="press flex min-h-11 items-center text-[13px] underline underline-offset-4">
          Change
        </Link>
      </div>

      <Section n="01" title="Vintage">
        <select
          value={vintage}
          onChange={(e) => setVintage(e.target.value)}
          aria-label="Vintage year"
          className="field appearance-none bg-[length:12px] bg-[right_14px_center] bg-no-repeat pr-9"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' fill='none' stroke='%23736F6E' stroke-width='1.5'%3E%3Cpath d='m1 1 5 5 5-5'/%3E%3C/svg%3E\")",
          }}
        >
          <option value="NV">Non-vintage</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </Section>

      <Section n="02" title="Rating">
        <StarInput value={rating} onChange={setRating} />
      </Section>

      <Section n="03" title="Dosage">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
          {DOSAGES.map((d) => (
            <button
              key={d}
              type="button"
              aria-pressed={dosage === d}
              onClick={() => setDosage(dosage === d ? null : d)}
              className="chip press shrink-0"
            >
              {d}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-text-muted">Optional. It is printed on the back label.</p>
      </Section>

      <Section n="04" title="Tasting note">
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={1000}
          placeholder="Brioche, citrus, chalk, a long finish…"
          aria-label="Tasting note"
          className="field"
        />
      </Section>

      <Section n="05" title="Photo">
        <PhotoPicker value={photos} onChange={setPhotos} />
      </Section>

      <Section n="06" title="Where">
        <input
          value={venue}
          onChange={(e) => setVenue(e.target.value)}
          maxLength={120}
          placeholder="Home, a bar, a vineyard…"
          aria-label="Venue"
          autoComplete="off"
          className="field"
        />
      </Section>

      <div className="sticky bottom-[calc(var(--nav-height)+env(safe-area-inset-bottom))] z-20 border-t border-border bg-background px-4 py-3">
        {error && (
          <p role="alert" className="mb-2 text-[13px] text-brand-hover">
            {error}
          </p>
        )}
        {canPost || sessionLoading ? (
          <button type="submit" disabled={submitting || sessionLoading} className="btn btn-primary press w-full">
            {submitting ? "Posting…" : "Post check-in"}
          </button>
        ) : (
          <Link href="/profile" className="btn btn-primary press w-full">
            Sign in to post
          </Link>
        )}
      </div>
    </form>
  );
}

export default function CheckInPage() {
  return (
    <Suspense fallback={<PageHeader title="Check in" />}>
      <CheckInForm />
    </Suspense>
  );
}
