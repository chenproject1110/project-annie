# PROJECT ANNIE — Roadmap 3.0 (Mobile-First)

Where 2.0 was about *features* (entity pages, import, stats), **3.0 is about
feel** — making ANNIE behave like a native mobile app, not a website in a phone.
Grounded in how AniList / Kurozora / ManGo / MAL behave today and where mobile UX
is heading in 2026. Still a personal project for you + friends, so: utility and
polish over growth.

Effort: S = hours, M = a day or two, L = several days. Impact = value to you on a
phone.

> **Progress:** Shipped — studio filter (3), bottom-sheet filters (4), haptics (5),
> **light/dark theme (1)**, **MAL import (11)** with keep-furthest-progress merge,
> **recent-activity feed (10)**, and **comfort toggles (7)** — minimal mode +
> spoiler-safe blur. **Still open:** swipe actions (2) and pull-to-refresh (6) —
> deferred, need on-device gesture testing; **sidebar redesign (8)**; **custom lists
> / tags (9)** — needs a new DB table/migration; and **notifications** — on hold.
> No new migration needed for what's shipped so far.

---

## Carried over from 2.0 (not yet built)

These were parked in `ROADMAP-NEXT.md`; they belong in 3.0's scope:

- **Studio search filter on Browse** — Browse has genre + format; studio was
  deferred because AniList's media query can't filter by studio *name*. Now that
  Studio pages exist (we have the `Studio` query + ids), add a studio search box
  to the Browse filter sheet: type a studio → resolve to id → filter the grid.
- **Custom lists / tags** — your own buckets beyond the five statuses.
- **Activity / watch-history feed** — a personal "what I did this week."
- **MAL import** — accept a MyAnimeList `.xml` export (AniList import already done).

---

## Priority matrix

| # | Feature | Impact | Effort | Theme |
|---|---------|--------|--------|-------|
| 1 | Light / dark theme (dark-first) | High | L | Theming |
| 2 | Swipe actions on list cards | High | M | Native feel |
| 3 | Studio search filter (Browse) | High | M | Discovery |
| 4 | Bottom-sheet filters & menus | Medium | M | Native feel |
| 5 | Haptics on key actions | Medium | S | Native feel |
| 6 | Pull-to-refresh | Medium | S | Native feel |
| 7 | Spoiler-safe + "Minimal" mode | Medium | M | Comfort |
| 8 | Sidebar redesign | Medium | M | Navigation |
| 9 | Custom lists / tags | Medium | M | List power |
| 10 | Activity / watch-history feed | Medium | M | Insight |
| 11 | MAL import | Low | M | Onboarding |
| — | New-episode push notifications | — | L | On hold |

---

## Theme: Theming

### 1. Light / dark theme — *High / L*

The flagship 3.0 item, and the reason it needs its own pass: the UI currently
hardcodes dark colors (`bg-[#0a0a0a]`, `text-white`, `bg-gray-800`, `white/10`…)
in ~40 components, so light mode isn't a toggle — it's a **design-token
migration**.

Plan:
- Define semantic CSS variables (`--bg`, `--surface`, `--surface-2`, `--text`,
  `--text-muted`, `--border`, `--accent`) for a **dark** (default) and **light**
  palette, set on `<html>` via a `theme` class.
- Either map Tailwind theme colors to those vars (cleanest) or do a systematic
  `dark:` refactor. Keep dark as the *primary* surface — 2026 practice treats dark
  as the design, not an inverted afterthought, and it saves battery on OLED.
- A toggle in the **navbar + sidebar** (System / Light / Dark), persisted.
- Stretch: time-of-day auto theme.

This is a few focused days of careful, mechanical work — best done in isolation
with a build after each surface.

---

## Theme: Native feel (the biggest perceived-quality wins)

### 2. Swipe actions on list cards — *High / M*

The single most "app-like" upgrade. On your profile list and Continue Watching:
- **Swipe right → +1 episode**, **swipe left → quick status menu** (or mark
  completed). Kurozora/ManGo lean on exactly this.
- Pair with optimistic updates (already in place) and haptics (#5).

### 4. Bottom-sheet filters & menus — *Medium / M*

2026's dominant mobile pattern. Convert the Browse filter panel, the status
picker, and the sort menu into thumb-friendly **bottom sheets** that slide up
from the bottom, instead of inline dropdowns/expanders.

### 5. Haptics on key actions — *Medium / S*

"A gesture without haptics is a guess." Use the Web Vibration API (Android/PWA)
for a light tap on: +1 episode, status change, favourite, completing a show.
Cheap, and it makes everything feel intentional.

### 6. Pull-to-refresh — *Medium / S*

Standard mobile gesture, currently missing. Add to home, profile, and the airing
schedule so a downward tug refreshes the data.

---

## Theme: Discovery

### 3. Studio search filter — *High / M*

(Carried from 2.0.) Add a studio field to the Browse filters: a debounced search
against AniList `Studio(search:)`, pick one, and filter the season grid by that
studio id. Closes the last gap in the Browse filter set.

### 7. Spoiler-safe + "Minimal" mode — *Medium / M*

Two comfort toggles competitors are known for:
- **Spoiler-safe** (AniList's signature): for shows you're mid-watch, blur the
  synopsis and hide future episode counts/recaps until revealed.
- **Minimal mode** (MAL's new toggle): a setting that strips descriptions and
  dense metadata from the home/detail for a cleaner, faster read.

---

## Theme: Navigation

### 8. Sidebar redesign — *Medium / M*

(From the UI backlog.) The slide-out menu works but is sparse. Candidates: a
search field at the top, quick links (Search / Import / Settings — Settings now
added, icons now added), the theme toggle (#1), a compact recent-activity peek,
and a small version/footer. Decide final contents once theming lands.

---

## Theme: List power & onboarding (carryover)

### 9. Custom lists / tags — *Medium / M*
Your own buckets ("Comfort rewatches", "Rec'd by Kai"). New `custom_lists` table +
join; surfaced as extra tabs in the profile list view.

### 10. Activity / watch-history feed — *Medium / M*
A personal feed from `updated_at` changes — "Watched EP 7 of X", "Completed Y".

### 11. MAL import — *Low / M*
Parse a MyAnimeList `.xml` export and upsert into `anime_tracking`, alongside the
existing AniList username import.

- **No duplicates:** MAL exports use MAL ids, so each is translated to its AniList
  id (`media(idMal_in: […])`) before upserting. Rows key on `(user_id, anime_id)`
  by AniList id, so a title already imported from AniList resolves to the same row
  and is updated, not duplicated.
- **Merge rule — keep furthest progress (default):** when a title exists in both
  the import and your current list, take the *higher* episode progress so a
  re-import never moves you backward. Status follows the more-complete entry
  (e.g. `completed` wins over `watching`).
- **Unmatched entries:** MAL-only titles with no AniList equivalent are skipped,
  with a small "N entries couldn't be matched" summary after import.
- **How to get the file (will also be shown in-app):** on MyAnimeList →
  **Profile → List → Export**, choose *Anime*, download the `.xml.gz`, unzip to
  `.xml`, and upload it on ANNIE's import screen.

---

## On hold (by your call)

- **New-episode push notifications** — highest engagement lever, heaviest build
  (cron + Web Push; Android-only via the installed PWA, no iOS push). Revisit when
  you want ANNIE to ping you.
- **Public / shareable profiles** — social surface, parked.

---

## Suggested order

1. **Studio filter (3)** + **pull-to-refresh (6)** + **haptics (5)** — fast, high
   felt-value warm-up.
2. **Swipe actions (2)** + **bottom sheets (4)** — the core "native feel" leap.
3. **Light/dark theme (1)** — the big dedicated pass, once the above are stable.
4. **Sidebar redesign (8)** — slots in naturally after theming (needs the toggle).
5. Comfort + list power (7, 9, 10) and **MAL import (11)** as follow-ups.

---

Sources: [Best Anime Tracking Apps 2026 (Achriom)](https://www.achriom.com/blog/best-anime-tracking-apps/),
[Best Anime Apps 2026 (Microanime)](https://microanime.tv/blog/best-anime-apps-2026),
[ManGo tracker (App Store)](https://apps.apple.com/us/app/mango-anime-manga-tracker/id1604385869),
[Kurozora tracker (App Store)](https://apps.apple.com/us/app/kurozora-anime-manga-tracker/id1476153872),
[Mobile App Design Trends 2026 (Muzli)](https://muz.li/blog/whats-changing-in-mobile-app-design-ui-patterns-that-matter-in-2026/),
[Mobile UI/UX Trends 2026 (DesignStudio)](https://www.designstudiouiux.com/blog/mobile-app-ui-ux-design-trends/)
