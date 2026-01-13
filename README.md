# PROJECT ANNIE

A desktop-first Anime Discovery Platform built with Next.js, TypeScript, and Tailwind CSS.

## Features

- 🎯 **Bias-Free Discovery**: No ratings displayed - pure exploration
- 📅 **Seasonal Browsing**: Browse anime from Winter 2013 to upcoming seasons
- 🎨 **Modern UI**: Clean, responsive design with smooth hover effects and purple theme
- 🚀 **Powered by AniList**: Real-time data from the AniList GraphQL API
- 🔗 **Shareable URLs**: Filter state preserved in URL parameters
- 📺 **Comprehensive Details**: Detailed anime pages with cast, relations, and broadcast schedules
- 🌏 **Multiple Timezones**: GMT+8 for main grid, JST for detail pages
- ⚡ **Instant Feedback**: Loading skeletons for smooth navigation
- 🔍 **Complete Catalog**: Fetches all anime per season (not just top 50)

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Data Source**: AniList GraphQL API

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run the development server:**
   ```bash
   npm run dev
   ```

3. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
├── app/
│   ├── layout.tsx       # Root layout
│   ├── page.tsx         # Home page with anime grid
│   └── globals.css      # Global styles
├── components/
│   ├── AnimeCard.tsx    # Individual anime card with hover effects
│   └── SeasonFilter.tsx # Year/Season selector
└── lib/
    └── anilist.ts       # AniList API client
```

## Usage

- Use the **Year** dropdown to select a year (2013 to next year)
- Click on **Season** buttons to filter anime by season (Winter, Spring, Summer, Fall)
- Hover over anime cards to see title, studio, genres, and description
- Share your current view by copying the URL (filters are in the query params)

## API

The app uses the AniList GraphQL API to fetch anime data. No authentication is required for public data.

**Fetched Fields:**
- Title (English & Romaji)
- Cover Image
- Description
- Genres
- Episodes
- Studio

**Sort Order:** Always sorted by popularity (descending)

## License

MIT
