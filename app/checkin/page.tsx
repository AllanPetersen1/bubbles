"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import CheckInCard, { emptyDraft, toEdit, type CheckInDraft } from "@/components/CheckInCard";
import PageHeader from "@/components/PageHeader";
import { NotSignedInError, getBottle, submitCheckIn } from "@/lib/data";
import { useSession } from "@/lib/session";
import type { Bottle } from "@/lib/types";

function CheckInForm() {
  const router = useRouter();
  const params = useSearchParams();
  const bottleId = params.get("b");
  const ean = params.get("ean");
  const { user, loading: sessionLoading, demo } = useSession();

  const [fetched, setFetched] = useState<Bottle | null | undefined>(undefined);
  const bottle = bottleId ? fetched : null;
  const [draft, setDraft] = useState<CheckInDraft>(emptyDraft);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (bottleId) getBottle(bottleId).then(setFetched);
  }, [bottleId]);

  const canPost = demo || !!user;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!bottle) return;
    if (draft.rating === 0) {
      setError("Give it a rating first.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await submitCheckIn({ bottle, ...toEdit(draft), photos: draft.photos, ean });
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

      <div className="mx-4 my-5">
        <CheckInCard value={draft} onChange={(patch) => setDraft((d) => ({ ...d, ...patch }))} />
      </div>

      <div className="sticky bottom-[calc(var(--nav-height)+env(safe-area-inset-bottom))] z-20 lg:bottom-0 border-t border-border bg-background px-4 py-3">
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
