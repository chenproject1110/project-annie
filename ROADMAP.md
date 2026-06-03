# PROJECT ANNIE — Product Roadmap

A prioritized plan for making the app feel snappy and useful, mobile-first.
Grounded in the current codebase (Next.js 14 App Router, Supabase, AniList +
AnimeThemes + MAL). Effort is a rough build estimate (S = hours, M = a day or
two, L = several days). Impact is felt-value to a mobile user.

---

## 0. What's already done (don't rebuild these)

A quick audit so we plan forward, not sideways:

- **Optimistic tracking** — `AnimeTrackingButtons.tsx` already updates state
  instantly, rolls back on failure, and toasts via `sonner`. Solid.
- **5-status tracking** — watching / completed / planning / dropped / paused,
  with badge config in `context/TrackingContext.tsx`.
- **Mobile shell** — `Navbar.tsx` + dynamic `MobileMenu`, safe-area insets,
  44–48px touch targets, `active:scale` feedback, `viewportFit: cover`.
- **Accessibility/motion** — `useReducedMotion` respected, `aria-*` on controls.
- **Design language** — "Japandi" dark theme (`#0a0a0a`), violet accent,
  glassmorphism (`backdrop-blur`), `rounded-2xl`. Keep all new UI inside it.
- **Title language switch** — English/Romaji toggle persisted in context.
- **Theme songs** — AnimeThemes with MAL fallback (`lib/jikan.ts`).

The foundation is good. The gaps are mostly about **the daily-return loop** and
**discovery depth**, not polish.

---

## Priority matrix

| # | Feature | Impact | Effort | Phase |
|---|---------|--------|--------|-------|
| 1 | Episode progress tracking | High | M | 1 |
| 2 | "Continue watching" home rail | High | M | 1 |
| 3 | Profile = real list views (filter by status) | High | M | 1 |
| 4 | Weekly airing calendar | High | M | 2 |
| 5 | Browse filters (genre / format / studio) | High | M | 2 |
| 6 | "Because you tracked X" recommendations | Medium | M | 2 |
| 7 | Public / shareable profiles & lists | Medium | M | 3 |
| 8 | PWA install + offline shell | Medium | S | 3 |
| 9 | New-episode notifications | Medium | L | 4 |
| 10 | Image + perf audit | Medium | S | 4 |

---

## Phase 1 — The daily-return loop (start here)

This is the difference between "a site I checked once" and "an app I open every
day." All three build on your existing Supabase `anime_tracking` table.

### 1. Episode progress tracking — *High / M*

Right now tracking stores only a `status`. The single highest-frequency action
on MAL/AniList is **"+1 episode."** Add it.

- **Schema:** add `progress INT DEFAULT 0` (and optionally `total_episodes`) to
  `anime_tracking`.
- **API:** extend `app/api/tracking/route.ts` to accept `{ animeId, progress }`
  and upsert it alongside status.
- **UI:** a compact stepper (`– 7/12 +`) on the detail page and on list cards.
  Reuse the optimistic pattern already in `AnimeTrackingButtons.tsx`.
- **Nice touch:** auto-set status to `completed` when progress hits total.

### 2. "Continue watching" home rail — *High / M*

On `app/page.tsx`, add a top rail (above trending) showing shows the signed-in
user is `watching` with `progress < total`, sorted by most recently updated.
Each card shows the next episode and a one-tap +1.

- Read from `TrackingContext` + a new query for progress.
- This is *the* feature that creates a daily habit. Pairs directly with #1.
- Gracefully hide the rail for logged-out users (you already branch on auth).

### 3. Profile as real list views — *High / M*

`/profile` should be the user's home base: tabs or a segmented control for
Watching / Planning / Completed / Paused / Dropped, each a filtered grid.

- Reuse your grid components (`JapandiBrowseAnimeGrid` / `AnimeGridWrapper`).
- Add a count badge per status (you already have `TRACKING_BADGE` styling).
- Mobile: segmented control as a horizontally scrollable pill row.

---

## Phase 2 — Discovery depth

Your "bias-free, no ratings" stance means discovery must come from *signals
other than score*. These three deliver that.

### 4. Weekly airing calendar — *High / M*

An AniChart-style "what's airing this week" view. One of the stickiest features
in the category and a perfect fit for your seasonal identity.

- AniList exposes `airingSchedule` / `nextAiringEpisode`; add a query in
  `lib/anilist.ts`.
- Group by weekday in the user's timezone (you already handle GMT+8 / JST).
- Highlight episodes from shows in the user's list.

### 5. Browse filters — *High / M*

Browse is season-only today. Add genre, format (TV/Movie/ONA/Special), and
studio filters — powerful discovery that never needs a score.

- Extend `FetchAnimeParams` in `lib/anilist.ts` (AniList's `media` query
  supports `genre_in`, `format`, etc.).
- Keep filter state in the URL (you already do this — extend the pattern).
- Mobile: a bottom-sheet filter panel rather than inline dropdowns.

### 6. "Because you tracked X" recommendations — *Medium / M*

AniList's `Media.recommendations` field gives related titles with **no score
dependency** — ideal for your model.

- For each completed/watching title, pull recommendations; dedupe against the
  user's list; surface a rail on home and on the detail page.

---

## Phase 3 — Social & shareable

The research is clear: anime fans love recommending. Give them links.

### 7. Public profiles & shareable lists — *Medium / M*

- Add a `username` (or use display name slug) and a `is_public` flag on
  `profiles`.
- A read-only `/u/[username]` route rendering their public lists.
- "Share" button → copy link. You already preserve state in URLs, so this is a
  natural extension.

### 8. PWA install + offline shell — *Medium / S*

Make it installable so it lives on the home screen and *feels* native.

- Add a `manifest.json` (icons you already have via `app/icon.svg`), theme color
  `#0a0a0a`, display `standalone`.
- A lightweight service worker to cache the app shell + recently viewed covers.
- Big perceived-quality win for very little effort.

---

## Phase 4 — Retention & polish

### 9. New-episode notifications — *Medium / L*

Notify users when a tracked, currently-airing show drops a new episode.

- Requires a scheduled job (cron) checking AniList `nextAiringEpisode` against
  users' watching lists, plus Web Push (or email via Supabase).
- Highest retention lever, but the most infrastructure — hence last.

### 10. Image & perf audit — *Medium / S*

Verify the snappy feel holds on real mobile data:

- Confirm every cover uses `next/image` with correct `sizes` + blur placeholder.
- Add skeletons to the browse grid and search (detail page already has them).
- Lighthouse mobile pass; watch LCP on the cover-heavy grids.

---

## Suggested first sprint

Phase 1 in order: **episode progress → continue-watching rail → profile list
views.** They share one data model, reinforce each other, and together flip the
app from "discovery toy" to "daily driver." Once those land, reassess against
Phase 2.

## Open questions to decide before building

- **Progress source of truth:** store `total_episodes` per tracked row, or always
  read it live from AniList? (Affects #1 and the auto-complete behavior.)
- **Bottom nav vs. burger:** the current burger menu is clean, but a thumb-level
  bottom tab bar (Home / Browse / Calendar / My List) is more native-feeling once
  there are 4+ destinations. Worth A/B-ing after Phase 2 adds the Calendar.
- **Recommendations scope:** home-only, detail-only, or both?
