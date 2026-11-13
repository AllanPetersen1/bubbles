"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import PageHeader, { DemoNote } from "@/components/PageHeader";
import ReviewActions from "@/components/ReviewActions";
import { StarRow } from "@/components/Stars";
import { fetchMyCheckIns } from "@/lib/data";
import { formatRating } from "@/lib/rating";
import { useSession } from "@/lib/session";
import { timeAgo } from "@/lib/time";
import type { FeedItem, Source } from "@/lib/types";

export default function ActivityPage() {
  const { user, loading: sessionLoading } = useSession();
  const [items, setItems] = useState<FeedItem[] | null>(null);
  const [source, setSource] = useState<Source>("live");

  useEffect(() => {
    if (!user) return;
    fetchMyCheckIns(user.id).then(({ data, source }) => {
      setItems(data);
      setSource(source);
    });
  }, [user]);

  return (
    <>
      <PageHeader title="Activity" eyebrow={items ? `Your pours · ${items.length}` : "Your pours"} />
      {source === "demo" && <DemoNote />}

      {!sessionLoading && !user && (
        <div className="px-4 py-16 text-center">
          <p className="font-display text-[22px]">Sign in to see your history</p>
          <Link href="/profile" className="btn btn-primary press mt-5">
            Sign in
          </Link>
        </div>
      )}

      {items && items.length === 0 && (
        <div className="px-4 py-16 text-center">
          <p className="font-display text-[22px]">Your glass is empty</p>
          <p className="mt-1 text-sm text-text-muted">Check-ins you post will collect here.</p>
          <Link href="/search" className="btn btn-gold press mt-5">
            Check in a bottle
          </Link>
        </div>
      )}

      {items && items.length > 0 && (
        <ul>
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-1 border-b border-border py-3 pr-1 pl-4">
              <div className="min-w-0 flex-1">
                <p className="eyebrow truncate">{item.producer}</p>
                <p className="truncate font-display text-[18px] leading-tight">
                  {item.cuvee}
                  <span className="text-text-muted"> · {item.vintage ?? "NV"}</span>
                </p>
                <p className="mt-0.5 text-xs text-text-muted">{timeAgo(item.createdAt)}</p>
              </div>
              <div className="mr-2 flex flex-col items-end gap-1">
                <StarRow value={item.rating} size={13} />
                <span className="text-xs font-semibold tabular-nums">{formatRating(item.rating)}</span>
              </div>
              <ReviewActions
                item={item}
                onChange={(next) => setItems((prev) => prev && prev.map((i) => (i.id === next.id ? next : i)))}
                onDelete={(id) => setItems((prev) => prev && prev.filter((i) => i.id !== id))}
              />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
