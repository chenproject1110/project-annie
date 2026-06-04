# PROJECT ANNIE — Roadmap v2 (Upcoming)

> **Progress note (autonomous session):** Shipped — Character pages (3), Studio
> pages + studio links (4), AniList list **import** (1), **stats dashboard** (2),
> profile **list controls** + Favourites (5), **multi-entity search** (8),
> **settings** page (10), and **per-entry extras** — private favourite, rewatch
> count, notes (6). Requires running two SQL migrations:
> `supabase/migrations/0002_entry_extras.sql` (and `0001` if not already applied).
> **Still open:** custom lists/tags (7), activity feed (9), and the on-hold public
> profiles + notifications. Verify with `npm run build` before deploying.

A forward-looking plan, written for what this project actually is: a personal
anime tracker for you and a few friends. So it leans toward **power-user utility
and things that are fun to own**, not growth, virality, or moderation overhead.
Effort: S = hours, M = a day or two, L = several days. Impact = value to you.

---

## Already shipped (context)

- **Episode progress** + progress bars across every card, **Continue Watching** rail.
- **Recommendations** — personalized home rail + per-title "Recommended" section.
- **Airing calendar** — live highlight, your tracked badges, Following-only filter,
  per-day counts, EP badges, JST/Local/GMT+8 toggle.
- **Browse filters** — genre + format (studio pending, see below).
- **Voice-actor (Staff) pages** with full paginated filmography + character cards.
- **Search results page** (partial/fuzzy), **mobile bottom nav**, **PWA install**.
- **Performance** — streamed home, loading skeletons on every route, warm router cache.

---

## Priority matrix

| # | Feature | Impact | Effort | Theme |
|---|---------|--------|--------|-------|
| 1 | Import your list from AniList / MAL | High | M | Onboarding |
| 2 | Personal stats dashboard | High | M | Insight |
| 3 | Character pages | High | S | Entity pages |
| 4 | Studio pages (+ unlocks studio filter) | High | M | Entity pages |
| 5 | Profile list controls (sort / filter / search) | High | M | List power |
| 6 | Per-entry extras: notes, rewatches, private favourite | Medium | M | List power |
| 7 | Custom lists / tags | Medium | M | List power |
| 8 | Multi-entity search (characters/staff/studios) | Medium | S | Discovery |
| 9 | Personal activity / watch history | Medium | M | Insight |
| 10 | Settings page (defaults) | Low | S | QoL |
| — | Public profiles · New-episode notifications | — | — | On hold |

---

## Theme: Onboarding

### 1. Import your list from AniList / MAL — *High / M*

The fastest way to make ANNIE *yours* (and your friends') overnight: pull in an
existing list instead of re-tracking from scratch.

- **AniList:** their public GraphQL `MediaListCollection` returns a user's full
  list by username — statuses and episode progress map straight onto your
  `anime_tracking` table.
- **MAL:** accept their XML list export and parse it.
- A simple "Import" screen: paste an AniList username (or upload a MAL export),
  preview, confirm, upsert. This is genuinely the highest-leverage item here —
  it removes the cold-start problem for every new user you actually have.

---

## Theme: Insight (the "fun to own" stuff)

### 2. Personal stats dashboard — *High / M*

AniList's stats pages are a beloved feature. With episode progress already in
your data, you can compute: total episodes watched, estimated hours, count by
status, **genre breakdown**, titles per release year, and most-watched
studios / voice actors. Render with a few charts on the profile. Pure personal
delight, no external dependency beyond what you already fetch.

### 9. Personal activity / watch history — *Medium / M*

A lightweight feed of your own actions ("Watched EP 7 of X", "Completed Y"),
derived from `updated_at` changes. Nice for a "what did I do this week" view; no
social layer needed.

---

## Theme: Entity pages (reuse the Staff page pattern)

### 3. Character pages — *High / S*

You already built the Staff page; a **Character page** (`/character/[id]`) is the
same shape: AniList `Character` → `media` they appear in, plus their voice
actors. Wire it up from the character side of the cast cards. Small effort,
high "rabbit-hole" value.

### 4. Studio pages (+ unlocks the studio filter) — *High / M*

A `/studio/[id]` page listing a studio's works, newest first. This also solves
the gap from Phase 2: AniList can't filter media by studio *name*, but it can by
**studio id** via the `Studio` node — so building studio pages naturally enables
a working studio filter on Browse. Two features, one query path.

---

## Theme: List power-user features

### 5. Profile list controls — *High / M*

Your profile already groups by status. Add **sort** (recently updated, title,
progress, release year) and a **filter / search within your list**. Once your
list grows past ~50 titles this becomes essential.

### 6. Per-entry extras — *Medium / M*

Optional, private metadata on a tracked entry: free-text **notes**, a
**rewatch count**, and a **private favourite** heart. Note the identity
tension — ANNIE is deliberately bias-free, so a *private favourite* (yes/no) fits
your ethos better than a public 1–10 score. Schema: a few nullable columns on
`anime_tracking`.

### 7. Custom lists / tags — *Medium / M*

Beyond the five statuses, let yourself bucket titles into your own lists
("Comfort rewatches", "Recommended by Kai"). AniList's custom-list feature is
exactly this. Needs a small `custom_lists` + join table.

---

## Theme: Discovery & QoL

### 8. Multi-entity search — *Medium / S*

AniList's search returns anime **and** characters, staff, and studios. Extend the
`/search` page with tabs or grouped results so searching "Bind" can surface the
studio, "Chiba" the voice actor. Small once the entity pages above exist.

### 10. Settings page — *Low / S*

One place for defaults you currently set ad hoc: default title language
(EN/Romaji — already toggled), default schedule timezone, default landing tab.
Persist per-user (Supabase) or locally.

---

## On hold (deliberately)

- **Public / shareable profiles** — fun for sharing with your friends, but it's a
  social/privacy surface you said can wait. Easy to revisit; the read-only view
  is mostly built into the profile already.
- **New-episode notifications** — highest retention lever, but heaviest: needs a
  cron + Web Push. Now *more* feasible since the PWA is installable (Android push
  works once installed; iOS still won't). Good candidate once you want ANNIE to
  ping you.

---

## Suggested order

For maximum personal payoff: **import (1)** so your real list lives here →
**character + studio pages (3, 4)** since they're cheap and unlock the studio
filter → **stats dashboard (2)** for the delight factor → then list controls and
per-entry extras as your library grows. Notifications and public profiles stay
parked until you specifically want them.

---

Sources: [AniList feature overview (AlternativeTo)](https://alternativeto.net/software/anilist-co/about/),
[AniList lesser-known features (forum)](https://anilist.co/forum/thread/6792),
[MyAnimeList (Google Play listing)](https://play.google.com/store/apps/details?id=net.myanimelist.app&hl=en_US),
[Best Anime Tracking Apps 2026 (Achriom)](https://www.achriom.com/blog/best-anime-tracking-apps/)
