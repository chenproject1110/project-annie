'use client';

import { Season } from '@/lib/anilist';
import { SeasonFilter } from './SeasonFilter';
import { SearchBar } from './SearchBar';

interface AnimeGridWrapperProps {
  currentYear: number;
  currentSeason: Season;
  focusSearch?: boolean;
  children: React.ReactNode;
}

export function AnimeGridWrapper({ currentYear, currentSeason, focusSearch = false, children }: AnimeGridWrapperProps) {
  return (
    <>
      {/* Filters Container */}
      <div className="mb-4 sm:mb-6 overflow-visible">
        {/* Row 1: Year/Season — no overflow-x here or the year menu clips (see SeasonFilter). */}
        <SeasonFilter currentYear={currentYear} currentSeason={currentSeason} />

        {/* Row 2: Search Bar - Always Visible */}
        <div className="mt-3 sm:mt-4">
          <SearchBar isOpen={true} autoFocus={focusSearch} />
        </div>
      </div>

      <div className="mt-4 sm:mt-8">{children}</div>
    </>
  );
}
