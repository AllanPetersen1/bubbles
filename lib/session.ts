"use client";

import { useEffect, useState } from "react";
import { MOCK_USER } from "./mock";
import { getSupabase } from "./supabase";

export type SessionUser = { id: string; name: string; avatarUrl: string | null };

type State = { user: SessionUser | null; loading: boolean; demo: boolean };

type AuthUser = {
  id: string;
  user_metadata?: { full_name?: string; name?: string; avatar_url?: string; picture?: string };
};

function toUser(u: AuthUser): SessionUser {
  const meta = u.user_metadata ?? {};
  return {
    id: u.id,
    name: meta.full_name ?? meta.name ?? "Taster",
    avatarUrl: meta.avatar_url ?? meta.picture ?? null,
  };
}

/** Current user. In demo mode (no Supabase) there is always a local demo user. */
export function useSession(): State {
  const [state, setState] = useState<State>(() =>
    getSupabase()
      ? { user: null, loading: true, demo: false }
      : { user: MOCK_USER, loading: false, demo: true },
  );

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return; // demo mode: the initial state is final
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (active) setState({ user: data.user ? toUser(data.user) : null, loading: false, demo: false });
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) {
        setState({ user: session?.user ? toUser(session.user) : null, loading: false, demo: false });
      }
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  return state;
}
