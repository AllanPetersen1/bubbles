# Bubbles

Untappd meets Vivino for Champagne and sparkling wine. Mobile-first PWA: find a bottle (search or barcode), log a check-in, share it to a feed.

Next.js (App Router, TypeScript, Tailwind) + Supabase (Postgres, Auth, Storage). Free tiers only.

## Run it

```bash
npm install
npm run dev
```

With no environment variables the app runs in **demo mode**: mock bottles and feed, check-ins saved to this browser only. Open it at phone width.

## Go live with Supabase

1. Create a Supabase project.
2. In the SQL editor run `supabase/schema.sql`, then `supabase/seed.sql`.
3. Authentication → Providers → enable Google. Add your site URL and `http://localhost:3000` to the redirect URLs.
4. Copy `.env.example` to `.env.local` and fill in the project URL and publishable (anon) key.

If a Supabase call fails, the screen falls back to demo data and shows a "Demo data" note.

## Where things are

| Path | What |
| --- | --- |
| `app/globals.css` | All colours (`@theme` block, semantic names) and shared button/field styles |
| `lib/image.ts` | Canvas compression: 400px thumb (~25 KB) and 1080px full (~120 KB) |
| `lib/data.ts` | Search, barcode lookup, feed (cursor on `created_at`), check-in submit |
| `components/Scanner.tsx` | `@zxing/browser` barcode scanner with typed-number fallback |
| `app/checkin/page.tsx` | Vintage → rating (0.5–5.0) → dosage → note → photo → venue |
| `supabase/schema.sql` | Tables, trigram search, RLS, storage policies |

## Known gaps

- Safari cannot encode WebP from a canvas, so photos fall back to JPEG there (same size budget).
- No service worker yet (manifest and icons only), so no offline support.
- Not built yet: adding unlisted bottles, follows/likes/comments, reporting and moderation, account deletion, privacy policy. The last three are needed before a public EU launch.
- Feed cursor uses `created_at` only; add `id` as a tie-breaker before real traffic.
- Photos live on `check_ins` (`thumb_path`, `full_path`), one per check-in, rather than a separate table.
