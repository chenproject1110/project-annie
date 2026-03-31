'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { Season } from '@/lib/anilist';

interface SeasonFilterProps {
  currentYear: number;
  currentSeason: Season;
  onLoadingChange?: (isLoading: boolean) => void;
}

const SEASONS: Season[] = ['WINTER', 'SPRING', 'SUMMER', 'FALL'];

const SEASON_LABELS: Record<Season, string> = {
  WINTER: 'Winter',
  SPRING: 'Spring',
  SUMMER: 'Summer',
  FALL: 'Fall',
};

/**
 * Generate years from 2013 to next year
 */
function getAvailableYears(): number[] {
  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let year = 2013; year <= currentYear + 1; year++) {
    years.push(year);
  }
  return years.reverse(); // Most recent first
}

export function SeasonFilter({ currentYear, currentSeason, onLoadingChange }: SeasonFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const availableYears = getAvailableYears();

  // Notify parent component when loading state changes
  useEffect(() => {
    onLoadingChange?.(isPending);
  }, [isPending, onLoadingChange]);

  const updateFilters = (year: number, season: Season) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('year', year.toString());
    params.set('season', season);
    
    // Use startTransition for non-blocking navigation
    startTransition(() => {
      router.push(`/browse?${params.toString()}`);
    });
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateFilters(parseInt(e.target.value), currentSeason);
  };

  const handleSeasonChange = (season: Season) => {
    updateFilters(currentYear, season);
  };

  return (
    <div className="flex items-center gap-3 sm:gap-6 overflow-x-auto pb-2 scrollbar-hide">
      {/* Year Selector */}
      <div className="relative flex-shrink-0">
        <label htmlFor="year-select" className="block text-xs sm:text-sm font-medium text-gray-400 mb-1 sm:mb-2">
          Year
        </label>
        <div className="relative">
          <select
            id="year-select"
            value={currentYear}
            onChange={handleYearChange}
            className="appearance-none bg-gray-800 text-white px-3 sm:px-6 py-2 sm:py-3 pr-8 sm:pr-10 rounded-lg border border-gray-700 hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent cursor-pointer transition-colors text-sm sm:text-base"
          >
            {availableYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Season Selector */}
      <div className="flex-shrink-0">
        <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-1 sm:mb-2">
          Season
        </label>
        <div className="flex gap-1.5 sm:gap-2">
          {SEASONS.map((season) => (
            <button
              key={season}
              onClick={() => handleSeasonChange(season)}
              className={`min-h-11 px-3 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-all text-sm sm:text-base whitespace-nowrap active:scale-95 ${
                currentSeason === season
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/50'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700 hover:border-gray-600'
              }`}
            >
              {SEASON_LABELS[season]}
            </button>
          ))}
        </div>
      </div>
      
      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
