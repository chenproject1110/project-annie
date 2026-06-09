import { Suspense } from 'react';
import type { Metadata } from 'next';
import { type Season, getAnimeSeasonNow } from '@/lib/anilist';
import { AnimeGridWrapper } from '@/components/AnimeGridWrapper';
import {
  JapandiBrowseAnimeGrid,
  JapandiBrowseGridSkeleton,
} from '@/components/JapandiBrowseAnimeGrid';

/** Allow long seasonal fetches on serverless hosts that support it. */
export const maxDuration = 120;

export const metadata: Metadata = {
  title: 'Browse — PROJECT ANNIE',
  description: 'Browse anime by season and year. Powered by AniList.',
};

interface SearchParams {
  year?: string;
  season?: string;
  focus?: string;
  genres?: string;
  formats?: string;
  studio?: string;
}

function isValidSeason(season: string | undefined): season is Season {
  return season === 'WINTER' || season === 'SPRING' || season === 'SUMMER' || season === 'FALL';
}

export default async function BrowsePage({ searchParams }: { searchParams: SearchParams }) {
  const { season: currentSeason, year: currentYear } = getAnimeSeasonNow();

  const year = searchParams.year ? parseInt(searchParams.year) : currentYear;
  const season = isValidSeason(searchParams.season) ? searchParams.season : currentSeason;

  const validYear = year >= 2013 && year <= currentYear + 1 ? year : currentYear;

  const genres = searchParams.genres ? searchParams.genres.split(',').filter(Boolean) : [];
  const formats = searchParams.formats ? searchParams.formats.split(',').filter(Boolean) : [];
  const studio = searchParams.studio || undefined;

  return (
    <main className="min-h-screen bg-bg">
      <div className="mx-auto max-w-7xl px-8 py-4 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl md:text-4xl font-bold text-fg tracking-tight">Browse by season</h1>
          <p className="text-fg-muted text-sm sm:text-base mt-1">
            Judge by Art, Not by Numbers.
          </p>
        </div>

        <AnimeGridWrapper
          currentYear={validYear}
          currentSeason={season}
          focusSearch={searchParams.focus === 'search'}
        >
          <div className="mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-fg">
              {season.charAt(0) + season.slice(1).toLowerCase()} {validYear}
            </h2>
            <p className="text-fg-muted text-sm sm:text-base mt-1">Sorted by Popularity</p>
          </div>

          <Suspense
            key={`${validYear}-${season}-${genres.join(',')}-${formats.join(',')}-${studio ?? ''}`}
            fallback={<JapandiBrowseGridSkeleton />}
          >
            <JapandiBrowseAnimeGrid
              year={validYear}
              season={season}
              genres={genres}
              formats={formats}
              studio={studio}
            />
          </Suspense>
        </AnimeGridWrapper>
      </div>

      <footer className="border-t border-line/10 mt-12 sm:mt-20">
        <div className="mx-auto max-w-7xl px-8 py-4 sm:py-6 text-center text-fg-muted text-xs sm:text-sm">
          <p>
            Data provided by{' '}
            <a
              href="https://anilist.co"
              target="_blank"
              rel="noopener noreferrer"
              className="text-violet-400 hover:text-violet-300 transition-colors"
            >
              AniList
            </a>
          </p>
        </div>
      </footer>
    </main>
  );
}
