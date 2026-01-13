import { Suspense } from 'react';
import { fetchAnime, Season } from '@/lib/anilist';
import { AnimeGridWrapper } from '@/components/AnimeGridWrapper';
import { AnimeCard } from '@/components/AnimeCard';
import { Film } from 'lucide-react';
import { Logo } from '@/components/Logo';

interface SearchParams {
  year?: string;
  season?: string;
}

/**
 * Get current season based on month
 */
function getCurrentSeason(): Season {
  const month = new Date().getMonth() + 1; // 1-12
  if (month >= 1 && month <= 3) return 'WINTER';
  if (month >= 4 && month <= 6) return 'SPRING';
  if (month >= 7 && month <= 9) return 'SUMMER';
  return 'FALL';
}

/**
 * Validate season parameter
 */
function isValidSeason(season: string | undefined): season is Season {
  return season === 'WINTER' || season === 'SPRING' || season === 'SUMMER' || season === 'FALL';
}

async function AnimeGrid({ year, season }: { year: number; season: Season }) {
  try {
    const animeList = await fetchAnime({ season, year });

    if (!animeList || animeList.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Film className="w-16 h-16 mb-4 opacity-50" />
          <p className="text-xl font-medium">No anime found for this season</p>
          <p className="text-sm mt-2">Try selecting a different year or season</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
        {animeList.map((anime) => (
          <AnimeCard key={anime.id} anime={anime} />
        ))}
      </div>
    );
  } catch (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-red-400">
        <p className="text-xl font-medium">Failed to load anime</p>
        <p className="text-sm mt-2">Please try again later</p>
      </div>
    );
  }
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="aspect-[2/3] rounded-xl bg-gray-800 animate-pulse"
        />
      ))}
    </div>
  );
}

export default async function HomePage({ searchParams }: { searchParams: SearchParams }) {
  // Get year and season from URL params or use current date
  const currentYear = new Date().getFullYear();
  const currentSeason = getCurrentSeason();

  const year = searchParams.year ? parseInt(searchParams.year) : currentYear;
  const season = isValidSeason(searchParams.season) ? searchParams.season : currentSeason;

  // Validate year range
  const validYear = year >= 2013 && year <= currentYear + 1 ? year : currentYear;

  return (
    <main className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <Logo showText={false} />
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">PROJECT ANNIE</h1>
              <p className="text-gray-400 text-xs sm:text-sm mt-0.5 sm:mt-1">
                Judge by Art, Not by Numbers.
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {/* Always show filters wrapper */}
        <AnimeGridWrapper currentYear={validYear} currentSeason={season}>
          {/* Season Header - Always Visible */}
          <div className="mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              {season.charAt(0) + season.slice(1).toLowerCase()} {validYear}
            </h2>
            <p className="text-gray-400 text-sm sm:text-base mt-1">
              Sorted by Popularity
            </p>
          </div>

          {/* Anime Grid */}
          <Suspense fallback={<LoadingSkeleton />}>
            <AnimeGrid year={validYear} season={season} />
          </Suspense>
        </AnimeGridWrapper>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-12 sm:mt-20">
        <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 text-center text-gray-500 text-xs sm:text-sm">
          <p>Data provided by <a href="https://anilist.co" target="_blank" rel="noopener noreferrer" className="text-violet-500 hover:text-violet-400">AniList</a></p>
        </div>
      </footer>
    </main>
  );
}
