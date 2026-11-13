import type { Bottle, Dosage, FeedItem, ReferenceSuggestion } from "./types";

/*
  Demo data, used when Supabase env vars are missing or a query fails.
  Bottle names mirror supabase/seed.sql. Feed entries are made up.
*/

const B = (
  id: string,
  producer: string,
  name: string,
  region = "Champagne",
  category = "Champagne",
): Bottle => ({ id, producer, name, category, region });

export const MOCK_BOTTLES: Bottle[] = [
  B("m01", "Moët & Chandon", "Impérial Brut"),
  B("m02", "Veuve Clicquot", "Yellow Label Brut"),
  B("m03", "Bollinger", "Spécial Cuvée"),
  B("m04", "Krug", "Grande Cuvée"),
  B("m05", "Ruinart", "Blanc de Blancs"),
  B("m06", "Taittinger", "Brut Réserve"),
  B("m07", "Billecart-Salmon", "Brut Rosé"),
  B("m08", "Pol Roger", "Brut Réserve"),
  B("m09", "Laurent-Perrier", "La Cuvée"),
  B("m10", "Louis Roederer", "Brut Premier"),
  B("m11", "Dom Pérignon", "Vintage"),
  B("m12", "Egly-Ouriet", "Grand Cru Brut Tradition"),
  B("m13", "Jacques Selosse", "Initial"),
  B("m14", "Pierre Péters", "Cuvée de Réserve"),
  B("m15", "Agrapart", "7 Crus"),
  B("m16", "Larmandier-Bernier", "Latitude"),
  B("m17", "Charles Heidsieck", "Brut Réserve"),
  B("m18", "Gosset", "Grande Réserve"),
  B("m19", "Nyetimber", "Classic Cuvée", "West Sussex", "English sparkling"),
  B("m20", "Ca' del Bosco", "Cuvée Prestige", "Franciacorta", "Franciacorta"),
  B("m21", "Gramona", "La Cuvée", "Penedès", "Cava"),
  B("m22", "Nino Franco", "Rustico", "Valdobbiadene", "Prosecco"),
];

export const MOCK_POPULAR_IDS = ["m02", "m01", "m03", "m09", "m06", "m11"];

/** Demo only. Not a real product barcode. */
export const MOCK_EANS: Record<string, string[]> = {
  "0000000000017": ["m03"],
};

export const MOCK_USER = { id: "demo-user", name: "You (demo)", avatarUrl: null };

/** Demo-mode stand-ins for the appellations table (see supabase/seed-reference.sql). */
const MOCK_APPELLATIONS: ReferenceSuggestion[] = [
  { kind: "appellation", label: "Champagne AOC", detail: "Champagne · France" },
  { kind: "appellation", label: "Crémant d'Alsace", detail: "Alsace · France" },
  { kind: "appellation", label: "Crémant de Loire", detail: "Loire · France" },
  { kind: "appellation", label: "Franciacorta DOCG", detail: "Lombardy · Italy" },
  { kind: "appellation", label: "Trento DOC", detail: "Trentino · Italy" },
  { kind: "appellation", label: "Cava DO", detail: "Catalonia · Spain" },
  { kind: "appellation", label: "Sussex PDO", detail: "Sussex · England" },
];

type Seed = {
  who: string;
  bottle: string;
  vintage: number | null;
  rating: number;
  dosage: Dosage | null;
  note: string | null;
  venue: string | null;
  minutesAgo: number;
};

const SEEDS: Seed[] = [
  { who: "Astrid", bottle: "m03", vintage: null, rating: 4.5, dosage: "Brut", note: "Toasted brioche, baked apple, a long savoury finish. Better after ten minutes in the glass.", venue: "Home", minutesAgo: 14 },
  { who: "Mikkel", bottle: "m12", vintage: null, rating: 5, dosage: "Brut", note: "Dense and chalky with ripe pear. Worth every krone.", venue: "Wine bar, Vesterbro", minutesAgo: 95 },
  { who: "Camille", bottle: "m07", vintage: null, rating: 4, dosage: "Brut", note: "Wild strawberry and a thread of blood orange. Very fine mousse.", venue: "Terrace", minutesAgo: 240 },
  { who: "Jonas", bottle: "m02", vintage: null, rating: 3.5, dosage: "Brut", note: "Reliable. Yeasty, a little sweet-fruited on the nose.", venue: null, minutesAgo: 60 * 7 },
  { who: "Elodie", bottle: "m05", vintage: null, rating: 4.5, dosage: "Extra Brut", note: "Lemon zest, white flowers, mineral grip.", venue: "Rooftop bar", minutesAgo: 60 * 20 },
  { who: "Theo", bottle: "m11", vintage: 2013, rating: 5, dosage: "Brut", note: "Smoke, almond, lime. Tight now, give it years.", venue: "Birthday dinner", minutesAgo: 60 * 30 },
  { who: "Astrid", bottle: "m19", vintage: null, rating: 4, dosage: "Brut", note: "Proof English sparkling can hold its own. Crisp green apple.", venue: "Home", minutesAgo: 60 * 52 },
  { who: "Mikkel", bottle: "m13", vintage: null, rating: 4.5, dosage: "Brut Nature", note: "Oxidative, nutty, almost sherried. Polarising and brilliant.", venue: "Home", minutesAgo: 60 * 70 },
  { who: "Camille", bottle: "m22", vintage: null, rating: 3.5, dosage: "Extra Dry", note: "Easy, peachy, a good aperitivo bottle.", venue: "Picnic", minutesAgo: 60 * 96 },
  { who: "Jonas", bottle: "m04", vintage: null, rating: 5, dosage: "Brut", note: "Hazelnut, honey, ginger. Layered, endless.", venue: "Tasting at the cellar", minutesAgo: 60 * 120 },
  { who: "Elodie", bottle: "m09", vintage: null, rating: 4, dosage: "Brut", note: "Clean, citrus-led, very approachable.", venue: null, minutesAgo: 60 * 150 },
  { who: "Theo", bottle: "m14", vintage: null, rating: 4.5, dosage: "Brut", note: "Salty, precise, Mesnil at its most direct.", venue: "Home", minutesAgo: 60 * 190 },
];

function byId(id: string) {
  return MOCK_BOTTLES.find((b) => b.id === id)!;
}

export function buildMockFeed(now = Date.now()): FeedItem[] {
  return SEEDS.map((s, i) => {
    const bottle = byId(s.bottle);
    return {
      id: `mock-${i}`,
      createdAt: new Date(now - s.minutesAgo * 60_000).toISOString(),
      userId: `mock-${s.who}`,
      user: { name: s.who, avatarUrl: null },
      producer: bottle.producer,
      cuvee: bottle.name,
      vintage: s.vintage,
      rating: s.rating,
      dosage: s.dosage,
      note: s.note,
      venue: s.venue,
      thumbUrl: null,
    };
  });
}

/* Small local trigram similarity, so typos work in demo mode like pg_trgm does. */

export function normalise(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function trigrams(text: string): Set<string> {
  const out = new Set<string>();
  for (const word of text.split(" ")) {
    if (!word) continue;
    const padded = `  ${word} `;
    for (let i = 0; i < padded.length - 2; i++) out.add(padded.slice(i, i + 3));
  }
  return out;
}

export function similarity(a: string, b: string): number {
  const ta = trigrams(a);
  const tb = trigrams(b);
  if (!ta.size || !tb.size) return 0;
  let shared = 0;
  for (const t of ta) if (tb.has(t)) shared++;
  return shared / (ta.size + tb.size - shared);
}

export function mockSearch(query: string, limit = 20): Bottle[] {
  const q = normalise(query);
  if (q.length < 2) return [];
  return MOCK_BOTTLES.map((bottle) => {
    const haystack = normalise(`${bottle.producer} ${bottle.name} ${bottle.region ?? ""}`);
    const contains = haystack.includes(q) ? 0.5 : 0;
    // best match of the query against any single word, for typo tolerance
    const wordHit = Math.max(0, ...haystack.split(" ").map((w) => similarity(q, w)));
    return { bottle, score: Math.max(similarity(q, haystack), wordHit * 0.9) + contains };
  })
    .filter((r) => r.score >= 0.3)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((r) => r.bottle);
}

/** Best word-level match of the query inside a label, like word_similarity() in suggest_reference(). */
function labelScore(q: string, label: string): number {
  const text = normalise(label);
  if (text.includes(q)) return 1;
  return Math.max(0, ...text.split(" ").map((w) => similarity(q, w)));
}

export function mockSuggest(query: string, limit = 6): ReferenceSuggestion[] {
  const q = normalise(query);
  if (q.length < 2) return [];
  const producers = [...new Set(MOCK_BOTTLES.map((b) => b.producer))].map<ReferenceSuggestion>((label) => ({
    kind: "producer",
    label,
    detail: MOCK_BOTTLES.find((b) => b.producer === label)?.region ?? null,
  }));
  const areas = [...new Set(MOCK_BOTTLES.map((b) => b.region).filter((r): r is string => !!r))].map<ReferenceSuggestion>(
    (label) => ({ kind: "area", label, detail: null }),
  );
  return [...producers, ...areas, ...MOCK_APPELLATIONS]
    .map((s) => ({ s, score: labelScore(q, s.label) }))
    .filter((r) => r.score >= 0.4)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((r) => r.s);
}
