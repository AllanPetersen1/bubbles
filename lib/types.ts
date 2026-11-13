export const DOSAGES = [
  "Brut Nature",
  "Extra Brut",
  "Brut",
  "Extra Dry",
  "Sec",
  "Demi-Sec",
  "Doux",
] as const;
export type Dosage = (typeof DOSAGES)[number];

/** One cuvée. Vintage is chosen at check-in time, not stored here. */
export type Bottle = {
  id: string;
  producer: string;
  name: string;
  category: string;
  region: string | null;
  /** Barcode confirmations when the bottle came from an EAN lookup */
  score?: number;
};

export type FeedItem = {
  id: string;
  createdAt: string;
  /** Author. `user.name` / `user.avatarUrl` are already the resolved display values. */
  userId: string;
  user: { name: string; avatarUrl: string | null };
  producer: string;
  cuvee: string;
  vintage: number | null;
  rating: number;
  dosage: Dosage | null;
  note: string | null;
  venue: string | null;
  thumbUrl: string | null;
};

export type Photo = {
  blob: Blob;
  type: string;
  ext: "webp" | "jpg";
  width: number;
  height: number;
};

export type PhotoPair = { thumb: Photo; full: Photo };

export type CheckInInput = {
  bottle: Bottle;
  vintage: number | null;
  rating: number;
  dosage: Dosage | null;
  note: string;
  venue: string;
  photos: PhotoPair | null;
  /** Barcode the user scanned, if any: offered back to the crowd-sourced table */
  ean: string | null;
};

/** The fields an owner can change after posting. The bottle, date and photo stay as posted. */
export type CheckInEdit = {
  vintage: number | null;
  rating: number;
  dosage: Dosage | null;
  note: string;
  venue: string;
};

/** Autocomplete for what is not a bottle: producers, appellations and areas (village, sub-region, region). */
export type ReferenceSuggestion = {
  kind: "producer" | "appellation" | "area";
  label: string;
  detail: string | null;
};

export type Source = "live" | "demo";
