# Bubbles

Untappd meets Vivino for Champagne and sparkling wine. Mobile-first PWA: find a bottle (search or barcode), log a check-in, share it to a feed.

Next.js (App Router, TypeScript, Tailwind) + Supabase (Postgres, Auth, Storage). Free tiers only.

Phone: one column with tabs at the bottom. Desktop: sidebar from `lg`, plus a right rail of popular bottles from `xl`.

## Run it

```bash
npm install
npm run dev
```

With no environment variables the app runs in **demo mode**: mock bottles and feed, check-ins saved to this browser only. Open it at phone width.

## Go live with Supabase

1. Create a Supabase project.
2. In the SQL editor run, in order: `supabase/schema.sql`, `supabase/upgrade-1.sql`, `supabase/seed.sql`, `supabase/seed-reference.sql`.
   Already running an older schema? Run `upgrade-1.sql` and `seed-reference.sql` only (both are safe to re-run).
3. Authentication → Providers → enable Google. Add your site URL and `http://localhost:3000` to the redirect URLs.
4. Copy `.env.example` to `.env.local` and fill in the project URL and publishable (anon) key.

If a Supabase call fails, the screen falls back to demo data and shows a "Demo data" note.

## Where things are

| Path | What |
| --- | --- |
| `app/globals.css` | All colours (`@theme` block, semantic names) and shared button/field styles |
| `lib/image.ts` | Canvas compression: 400px thumb (~25 KB) and 1080px full (~120 KB) |
| `lib/data.ts` | Search, suggestions, barcode lookup, feed (cursor on `created_at`), check-in submit / edit / delete, profile overrides |
| `lib/cache.ts` | Small TTL cache that shares in-flight requests; search, suggestions and popular bottles go through it |
| `lib/rating.ts` | Rating step (0.25) and display format |
| `lib/session.ts` | Current user: custom name / photo first, Google metadata as fallback |
| `components/Scanner.tsx` | `@zxing/browser` barcode scanner with typed-number fallback |
| `components/CheckInCard.tsx` | The connected check-in card: notes → photo → rating → vintage → dosage → where. Used by the check-in page and the edit dialog |
| `components/ReviewActions.tsx` | Edit and delete (dialog + confirmation) for your own check-ins |
| `components/ProfileForm.tsx` | Custom display name and photo |
| `supabase/upgrade-1.sql` | Quarter-star ratings, custom profile fields, appellations, suggest function, owner-only column grants |
| `supabase/seed-reference.sql` | Appellations, villages / sub-regions, more producers and cuvées |
| `supabase/schema.sql` | Tables, trigram search, RLS, storage policies |

## Reference data

Search matches producer, cuvée, village, sub-region, region and appellation in one trigram query (`search_text`). Producers, appellations and areas also come back as tappable suggestions (`suggest_reference`). Results are cached in memory for five minutes, and the cache is cleared when check-ins change.

`seed-reference.sql` is written from general knowledge of public facts. It is not an import of icdb.parcelles.app or champagne.fr (champagne.fr disallows crawlers), so check the names against labels and check each source's terms before importing from it.

## Edit, delete and profile

- Only the author sees the edit and delete buttons. Every write also filters on `user_id`, and the database refuses the rest: row-level security plus column grants that allow an owner to change only vintage, rating, dosage, note and venue.
- Deleting a check-in removes its photos from storage unless another check-in uses the same file.
- `profiles.display_name` / `avatar_url` stay the Google snapshot. `custom_display_name` / `custom_avatar_url` override them when set, everywhere a user is shown.

## Known gaps

- Safari cannot encode WebP from a canvas, so photos fall back to JPEG there (same size budget).
- No service worker yet (manifest and icons only), so no offline support.
- Not built yet: adding unlisted bottles, follows/likes/comments, reporting and moderation, account deletion, privacy policy. The last three are needed before a public EU launch.
- Feed cursor uses `created_at` only; add `id` as a tie-breaker before real traffic.
- Editing a check-in cannot change its photo or bottle yet.
- Appellation renames do not refresh bottles' `search_text`; touch `champagnes.name` to rebuild.
- Photos live on `check_ins` (`thumb_path`, `full_path`), one per check-in, rather than a separate table.
