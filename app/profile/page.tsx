"use client";

import { useEffect, useState } from "react";
import Avatar from "@/components/Avatar";
import PageHeader, { DemoNote } from "@/components/PageHeader";
import { fetchMyCheckIns } from "@/lib/data";
import { useSession } from "@/lib/session";
import { getSupabase } from "@/lib/supabase";

export default function ProfilePage() {
  const { user, loading, demo } = useSession();
  const [stats, setStats] = useState<{ count: number; average: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchMyCheckIns(user.id).then(({ data }) => {
      const count = data.length;
      const average = count ? data.reduce((sum, i) => sum + i.rating, 0) / count : 0;
      setStats({ count, average });
    });
  }, [user]);

  async function signIn() {
    setError(null);
    const { error } = await getSupabase()!.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) setError("Sign-in did not start. Is Google enabled in Supabase?");
  }

  async function signOut() {
    await getSupabase()?.auth.signOut();
    setStats(null);
  }

  return (
    <>
      <PageHeader title="Profile" />
      {demo && <DemoNote />}

      {loading ? null : user ? (
        <div className="px-4 py-8">
          <div className="flex items-center gap-4">
            <Avatar name={user.name} url={user.avatarUrl} size={64} />
            <div>
              <p className="font-display text-[26px] leading-tight">{user.name}</p>
              {demo && <p className="text-[13px] text-text-muted">Check-ins stay on this device</p>}
            </div>
          </div>

          <dl className="mt-8 grid grid-cols-2 border-y border-border">
            <div className="border-r border-border px-1 py-5">
              <dt className="eyebrow">Check-ins</dt>
              <dd className="mt-1 font-display text-[34px] leading-none tabular-nums">{stats?.count ?? "–"}</dd>
            </div>
            <div className="px-4 py-5">
              <dt className="eyebrow">Average</dt>
              <dd className="mt-1 font-display text-[34px] leading-none tabular-nums">
                {stats && stats.count > 0 ? stats.average.toFixed(1) : "–"}
              </dd>
            </div>
          </dl>

          {!demo && (
            <button type="button" onClick={signOut} className="btn btn-quiet press mt-8 w-full">
              Sign out
            </button>
          )}
        </div>
      ) : (
        <div className="px-4 py-16 text-center">
          <p className="font-display text-[26px] leading-tight">Keep a record of every bottle</p>
          <p className="mx-auto mt-2 max-w-xs text-sm text-text-muted">
            Sign in to post check-ins and share them with the feed.
          </p>
          <button type="button" onClick={signIn} className="btn btn-primary press mt-6">
            Continue with Google
          </button>
          {error && (
            <p role="alert" className="mt-3 text-[13px] text-brand-hover">
              {error}
            </p>
          )}
        </div>
      )}
    </>
  );
}
