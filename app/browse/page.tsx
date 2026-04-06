import { Suspense } from 'react';
import type { Metadata } from 'next';
import { Season } from '@/lib/anilist';
import { AnimeGridWrapper } from '@/components/AnimeGridWrapper';
import {
  JapandiBrowseAnimeGrid,
  JapandiBrowseGridSkeleton,
} from '@/components/JapandiBrowseAnimeGrid';

/** Allow long seasonal fetches (many Jikan pages) on serverless hosts that support it. */
export const maxDuration = 120;

export const metadata: Metadata = {
  title: 'Browse — PROJECT ANNIE',
  description: 'Browse anime by season and year. Powered by MyAnimeList via Jikan.',
};

interface SearchParams {
  year?: string;
  season?: string;
}

function getCurrentSeason(): Season {
  const month = new Date().getMonth() + 1;
  if (month >= 1 && month <= 3) return 'WINTER';
  if (month >= 4 && month <= 6) return 'SPRING';
  if (month >= 7 && month <= 9) return 'SUMMER';
  return 'FALL';
}

function isValidSeason(season: string | undefined): season is Season {
  return season === 'WINTER' || season === 'SPRING' || season === 'SUMMER' || season === 'FALL';
}

export default async function BrowsePage({ searchParams }: { searchParams: SearchParams }) {
  const currentYear = new Date().getFullYear();
  const currentSeason = getCurrentSeason();

  const year = searchParams.year ? parseInt(searchParams.year) : currentYear;
  const season = isValidSeason(searchParams.season) ? searchParams.season : currentSeason;

  const validYear = year >= 2013 && year <= currentYear + 1 ? year : currentYear;

  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      <div className="mx-auto max-w-7xl px-8 py-4 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl md:text-4xl font-bold text-white tracking-tight">Browse by season</h1>
          <p className="text-gray-400 text-sm sm:text-base mt-1">
            Judge by Art, Not by Numbers.
          </p>
        </div>

        <AnimeGridWrapper currentYear={validYear} currentSeason={season}>
          <div className="mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              {season.charAt(0) + season.slice(1).toLowerCase()} {validYear}
            </h2>
            <p className="text-gray-400 text-sm sm:text-base mt-1">Sorted by Popularity</p>
          </div>

          <Suspense
            key={`${validYear}-${season}`}
            fallback={<JapandiBrowseGridSkeleton />}
          >
            <JapandiBrowseAnimeGrid year={validYear} season={season} />
          </Suspense>
        </AnimeGridWrapper>
      </div>

      <footer className="border-t border-white/10 mt-12 sm:mt-20">
        <div className="mx-auto max-w-7xl px-8 py-4 sm:py-6 text-center text-gray-500 text-xs sm:text-sm">
          <p>
            Data provided by{' '}
            <a
              href="https://myanimelist.net"
              target="_blank"
              rel="noopener noreferrer"
              className="text-violet-400 hover:text-violet-300 transition-colors"
            >
              MyAnimeList
            </a>
            {' · '}
            <a
              href="https://jikan.moe"
              target="_blank"
              rel="noopener noreferrer"
              className="text-violet-400 hover:text-violet-300 transition-colors"
            >
              Jikan API
            </a>
          </p>
        </div>
      </footer>
    </main>
  );
}
