import { blobToDataUrl, shortHash } from "./image";
import {
  MOCK_BOTTLES,
  MOCK_EANS,
  MOCK_POPULAR_IDS,
  MOCK_USER,
  buildMockFeed,
  mockSearch,
} from "./mock";
import { PHOTO_BUCKET, getSupabase, photoUrl } from "./supabase";
import type { Bottle, CheckInInput, Dosage, FeedItem, Photo, Source } from "./types";

/*
  Every function works in two modes:
  - live: Supabase configured, query succeeds
  - demo: no Supabase env vars, or the query failed. Mock data, localStorage.
*/

export const FEED_PAGE_SIZE = 10;
const LOCAL_CHECKINS = "bubbles.demo.checkins";
const LOCAL_RECENT = "bubbles.recent";

type Result<T> = { data: T; source: Source };

function warn(where: string, error: unknown) {
  console.warn(`[bubbles] ${where} failed, using demo data`, error);
}

/* ---------- Bottles ---------- */

type BottleRow = {
  id: string;
  producer: string;
  name: string;
  category: string;
  region: string | null;
  score?: number | null;
};

const toBottle = (r: BottleRow): Bottle => ({
  id: r.id,
  producer: r.producer,
  name: r.name,
  category: r.category,
  region: r.region,
  score: r.score ?? undefined,
});

export async function searchBottles(query: string): Promise<Result<Bottle[]>> {
  const q = query.trim();
  if (q.length < 2) return { data: [], source: "live" };
  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase.rpc("search_bottles", { q, lim: 20 });
    if (!error && data) return { data: (data as BottleRow[]).map(toBottle), source: "live" };
    warn("search_bottles", error);
  }
  return { data: mockSearch(q), source: "demo" };
}

export async function popularBottles(): Promise<Result<Bottle[]>> {
  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase.rpc("popular_bottles", { lim: 8 });
    if (!error && data) return { data: (data as BottleRow[]).map(toBottle), source: "live" };
    warn("popular_bottles", error);
  }
  const data = MOCK_POPULAR_IDS.map((id) => MOCK_BOTTLES.find((b) => b.id === id)!);
  return { data, source: "demo" };
}

export async function bottlesByEan(ean: string): Promise<Result<Bottle[]>> {
  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase.rpc("bottles_by_ean", { p_ean: ean });
    if (!error && data) return { data: (data as BottleRow[]).map(toBottle), source: "live" };
    warn("bottles_by_ean", error);
  }
  const ids = MOCK_EANS[ean] ?? [];
  return { data: MOCK_BOTTLES.filter((b) => ids.includes(b.id)), source: "demo" };
}

export async function getBottle(id: string): Promise<Bottle | null> {
  const supabase = getSupabase();
  if (supabase && !id.startsWith("m")) {
    const { data, error } = await supabase
      .from("champagnes")
      .select("id, name, category, producers(name, region)")
      .eq("id", id)
      .maybeSingle();
    if (!error && data) {
      const p = one<{ name: string; region: string | null }>(data.producers);
      return {
        id: data.id,
        name: data.name,
        category: data.category,
        producer: p?.name ?? "",
        region: p?.region ?? null,
      };
    }
    if (error) warn("getBottle", error);
  }
  return MOCK_BOTTLES.find((b) => b.id === id) ?? null;
}

/* Recently chosen bottles, kept on the device */

export function recentBottles(): Bottle[] {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_RECENT) ?? "[]") as Bottle[];
  } catch {
    return [];
  }
}

export function rememberBottle(bottle: Bottle) {
  try {
    const next = [bottle, ...recentBottles().filter((b) => b.id !== bottle.id)].slice(0, 5);
    localStorage.setItem(LOCAL_RECENT, JSON.stringify(next));
  } catch {
    /* storage can be unavailable (private mode): recents are a nicety */
  }
}

/* ---------- Feed ---------- */

type FeedRow = {
  id: string;
  created_at: string;
  vintage: number | null;
  rating: number;
  dosage: Dosage | null;
  note: string | null;
  venue: string | null;
  thumb_path: string | null;
  profiles: unknown;
  champagnes: unknown;
};

/** PostgREST returns an embedded row as an object or a one-item array depending on typing. */
function one<T>(value: unknown): T | null {
  if (Array.isArray(value)) return (value[0] as T) ?? null;
  return (value as T) ?? null;
}

const FEED_SELECT = `id, created_at, vintage, rating, dosage, note, venue, thumb_path,
  profiles(display_name, avatar_url),
  champagnes(name, producers(name))`;

function toFeedItem(row: FeedRow): FeedItem {
  const profile = one<{ display_name: string | null; avatar_url: string | null }>(row.profiles);
  const champagne = one<{ name: string; producers: unknown }>(row.champagnes);
  const producer = one<{ name: string }>(champagne?.producers);
  return {
    id: row.id,
    createdAt: row.created_at,
    user: { name: profile?.display_name ?? "Taster", avatarUrl: profile?.avatar_url ?? null },
    producer: producer?.name ?? "",
    cuvee: champagne?.name ?? "",
    vintage: row.vintage,
    rating: Number(row.rating),
    dosage: row.dosage,
    note: row.note,
    venue: row.venue,
    thumbUrl: photoUrl(row.thumb_path),
  };
}

function demoCheckIns(): FeedItem[] {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_CHECKINS) ?? "[]") as FeedItem[];
  } catch {
    return [];
  }
}

/**
 * Cursor pagination on created_at (newest first).
 * cursor = created_at of the last item already shown.
 * Two rows with the identical timestamp could be skipped: fine for a prototype,
 * use (created_at, id) before this gets real traffic.
 */
export async function fetchFeed(
  cursor: string | null,
): Promise<Result<{ items: FeedItem[]; nextCursor: string | null }>> {
  const supabase = getSupabase();
  if (supabase) {
    let query = supabase
      .from("check_ins")
      .select(FEED_SELECT)
      .order("created_at", { ascending: false })
      .limit(FEED_PAGE_SIZE);
    if (cursor) query = query.lt("created_at", cursor);
    const { data, error } = await query;
    if (!error && data) {
      const items = (data as unknown as FeedRow[]).map(toFeedItem);
      const nextCursor = items.length === FEED_PAGE_SIZE ? items[items.length - 1].createdAt : null;
      return { data: { items, nextCursor }, source: "live" };
    }
    warn("fetchFeed", error);
  }

  const all = [...demoCheckIns(), ...buildMockFeed()].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
  const start = cursor ? all.findIndex((i) => i.createdAt < cursor) : 0;
  const page = start === -1 ? [] : all.slice(start, start + FEED_PAGE_SIZE);
  const more = start !== -1 && start + FEED_PAGE_SIZE < all.length;
  return {
    data: { items: page, nextCursor: more ? page[page.length - 1].createdAt : null },
    source: "demo",
  };
}

export async function fetchMyCheckIns(userId: string): Promise<Result<FeedItem[]>> {
  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from("check_ins")
      .select(FEED_SELECT)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (!error && data) return { data: (data as unknown as FeedRow[]).map(toFeedItem), source: "live" };
    warn("fetchMyCheckIns", error);
  }
  return { data: demoCheckIns(), source: "demo" };
}

/* ---------- Check-in ---------- */

export class NotSignedInError extends Error {
  constructor() {
    super("Sign in to post a check-in");
  }
}

async function uploadPhoto(userId: string, photo: Photo, kind: "thumb" | "full"): Promise<string> {
  const supabase = getSupabase()!;
  const path = `${userId}/${await shortHash(photo.blob)}_${kind}.${photo.ext}`;
  const { error } = await supabase.storage.from(PHOTO_BUCKET).upload(path, photo.blob, {
    contentType: photo.type,
    cacheControl: "31536000", // content-hashed names never change
    upsert: true, // same bytes, same name: re-uploading is harmless
  });
  if (error) throw error;
  return path;
}

export async function submitCheckIn(input: CheckInInput): Promise<void> {
  const supabase = getSupabase();

  if (!supabase) {
    const thumbUrl = input.photos ? await blobToDataUrl(input.photos.thumb.blob) : null;
    const item: FeedItem = {
      id: `demo-${Date.now()}`,
      createdAt: new Date().toISOString(),
      user: { name: MOCK_USER.name, avatarUrl: null },
      producer: input.bottle.producer,
      cuvee: input.bottle.name,
      vintage: input.vintage,
      rating: input.rating,
      dosage: input.dosage,
      note: input.note.trim() || null,
      venue: input.venue.trim() || null,
      thumbUrl,
    };
    localStorage.setItem(LOCAL_CHECKINS, JSON.stringify([item, ...demoCheckIns()]));
    return;
  }

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new NotSignedInError();
  const userId = auth.user.id;

  let thumbPath: string | null = null;
  let fullPath: string | null = null;
  if (input.photos) {
    [thumbPath, fullPath] = await Promise.all([
      uploadPhoto(userId, input.photos.thumb, "thumb"),
      uploadPhoto(userId, input.photos.full, "full"),
    ]);
  }

  const { error } = await supabase.from("check_ins").insert({
    champagne_id: input.bottle.id,
    vintage: input.vintage,
    rating: input.rating,
    dosage: input.dosage,
    note: input.note.trim() || null,
    venue: input.venue.trim() || null,
    thumb_path: thumbPath,
    full_path: fullPath,
  });
  if (error) throw error;

  // Crowd-sourced barcodes: the user picked this bottle after scanning this EAN
  if (input.ean) {
    const { error: eanError } = await supabase.rpc("confirm_barcode", {
      p_ean: input.ean,
      p_champagne_id: input.bottle.id,
    });
    if (eanError) warn("confirm_barcode", eanError);
  }
}
