# PROJECT ANNIE

A desktop-first Anime Discovery Platform built with Next.js, TypeScript, and Tailwind CSS.

## Features

- 🎯 **Bias-Free Discovery**: No ratings displayed - pure exploration
- 📅 **Seasonal Browsing**: Browse anime from Winter 2013 to upcoming seasons
- 🎨 **Modern UI**: Clean, responsive design with smooth hover effects and purple theme
- 🚀 **Powered by AniList**: Real-time data from the AniList GraphQL API
- 🎵 **Theme Songs**: OP/ED data from AnimeThemes, with MyAnimeList as a fallback
- 👤 **Accounts & Tracking**: User profiles and watch tracking via Supabase
- 🔗 **Shareable URLs**: Filter state preserved in URL parameters
- 📺 **Comprehensive Details**: Detailed anime pages with cast, relations, and broadcast schedules
- 🌏 **Multiple Timezones**: GMT+8 for main grid, JST for detail pages
- ⚡ **Instant Feedback**: Loading skeletons for smooth navigation
- 🔍 **Complete Catalog**: Fetches all anime per season (not just top 50)

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Animation**: Framer Motion
- **Icons**: Lucide React
- **Toasts**: Sonner
- **Auth & Database**: Supabase (`@supabase/ssr`, `@supabase/supabase-js`)
- **Data Sources**: AniList GraphQL API, AnimeThemes API, MyAnimeList API v2

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**

   Create a `.env.local` file in the project root:

   ```bash
   # Supabase (required for accounts, profiles, and tracking)
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

   # MyAnimeList (optional — fallback source for OP/ED theme data)
   MAL_CLIENT_ID=your-mal-client-id
   ```

   AniList and AnimeThemes require no credentials. If the Supabase variables
   are missing, account features are disabled but the rest of the app still
   works. If `MAL_CLIENT_ID` is missing, theme data simply falls back to
   AnimeThemes only.

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Home page with anime grid
│   ├── browse/            # Browse / season grid
│   ├── anime/[id]/        # Anime detail pages
│   ├── login/            # Auth pages
│   ├── profile/         # User profile
│   └── api/
│       ├── profile/      # Supabase-backed profile route
│       └── tracking/    # Supabase-backed watch tracking route
├── components/           # UI components (AnimeCard, SearchBar, etc.)
└── lib/
    ├── anilist.ts        # AniList GraphQL client (listings, search)
    ├── anilist-detail.ts # AniList detail-page queries
    ├── jikan.ts          # AnimeThemes + MAL v2 theme-song client
    └── supabase/         # Supabase browser & server clients
```

## Usage

- Use the **Year** dropdown to select a year (2013 to next year)
- Click on **Season** buttons to filter anime by season (Winter, Spring, Summer, Fall)
- Hover over anime cards to see title, studio, genres, and description
- Share your current view by copying the URL (filters are in the query params)

## APIs

The app integrates four external services:

### AniList GraphQL API
- **Endpoint:** `https://graphql.anilist.co`
- **Auth:** None (public data)
- **Used for:** Core anime listings, search suggestions, and detail pages
- **Fetched fields:** Title (English & Romaji), cover image, description, genres,
  episodes, studio, cast, relations, broadcast schedule
- **Sort order:** Always sorted by popularity (descending)
- **Clients:** `lib/anilist.ts`, `lib/anilist-detail.ts`

### AnimeThemes API
- **Endpoint:** `https://api.animethemes.moe`
- **Auth:** None
- **Used for:** Primary source of opening/ending (OP/ED) theme song data, including
  song titles, artists, and video links
- **Client:** `lib/jikan.ts`

### MyAnimeList API v2
- **Endpoint:** `https://api.myanimelist.net/v2`
- **Auth:** `X-MAL-CLIENT-ID` header (`MAL_CLIENT_ID` env var)
- **Used for:** Fallback source for OP/ED theme data when AnimeThemes has no match
- **Client:** `lib/jikan.ts`

### Supabase
- **Auth:** `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Used for:** User authentication, profiles, and watch tracking
- **Clients:** `lib/supabase/client.ts` (browser), `lib/supabase/server.ts` (server),
  consumed by the `app/api/profile` and `app/api/tracking` routes

## License

MIT
