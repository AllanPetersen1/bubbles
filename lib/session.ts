"use client";

import { useEffect, useState } from "react";
import { PROFILE_EVENT, fetchProfileOverride, type ProfileOverride } from "./data";
import { MOCK_USER } from "./mock";
import { getSupabase } from "./supabase";

export type SessionUser = {
  id: string;
  /** What the app shows: the custom value when set, otherwise the Google one. */
  name: string;
  avatarUrl: string | null;
  /** From the Google account, shown as the placeholder in settings. */
  oauth: { name: string; avatarUrl: string | null };
  custom: ProfileOverride;
};

type State = { user: SessionUser | null; loading: boolean; demo: boolean };

type AuthUser = {
  id: string;
  user_metadata?: { full_name?: string; name?: string; avatar_url?: string; picture?: string };
};

function merge(id: string, oauth: SessionUser["oauth"], custom: ProfileOverride): SessionUser {
  return {
    id,
    name: custom.name || oauth.name,
    avatarUrl: custom.avatarUrl ?? oauth.avatarUrl,
    oauth,
    custom,
  };
}

async function resolve(u: AuthUser): Promise<SessionUser> {
  const meta = u.user_metadata ?? {};
  const oauth = { name: meta.full_name ?? meta.name ?? "Taster", avatarUrl: meta.avatar_url ?? meta.picture ?? null };
  return merge(u.id, oauth, await fetchProfileOverride(u.id));
}

const DEMO_OAUTH = { name: MOCK_USER.name, avatarUrl: MOCK_USER.avatarUrl };

/** Current user. In demo mode (no Supabase) there is always a local demo user. */
export function useSession(): State {
  const [state, setState] = useState<State>(() =>
    getSupabase()
      ? { user: null, loading: true, demo: false }
      : { user: merge(MOCK_USER.id, DEMO_OAUTH, { name: null, avatarUrl: null }), loading: false, demo: true },
  );

  useEffect(() => {
    const supabase = getSupabase();
    let active = true;
    const apply = (user: SessionUser | null) => {
      if (active) setState((s) => ({ ...s, user, loading: false }));
    };
    const load = async () => {
      if (!supabase) return apply(merge(MOCK_USER.id, DEMO_OAUTH, await fetchProfileOverride(MOCK_USER.id)));
      const { data } = await supabase.auth.getUser();
      apply(data.user ? await resolve(data.user) : null);
    };

    load();
    window.addEventListener(PROFILE_EVENT, load);
    const sub = supabase?.auth.onAuthStateChange((_event, session) => {
      // Deferred: awaiting Supabase calls inside this callback can deadlock the auth lock
      setTimeout(() => {
        if (!session?.user) return apply(null);
        resolve(session.user).then(apply);
      }, 0);
    });
    return () => {
      active = false;
      window.removeEventListener(PROFILE_EVENT, load);
      sub?.data.subscription.unsubscribe();
    };
  }, []);

  return state;
}
