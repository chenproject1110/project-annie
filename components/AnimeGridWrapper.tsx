'use client';

import { useState } from 'react';
import { Season } from '@/lib/anilist';
import { SeasonFilter } from './SeasonFilter';
import { SearchBar } from './SearchBar';

interface AnimeGridWrapperProps {
  currentYear: number;
  currentSeason: Season;
  children: React.ReactNode;
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

export function AnimeGridWrapper({ currentYear, currentSeason, children }: AnimeGridWrapperProps) {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <>
      {/* Filters Container */}
      <div className="mb-4 sm:mb-6">
        {/* Row 1: Year/Season Filters */}
        <div className="overflow-x-auto">
          <SeasonFilter 
            currentYear={currentYear} 
            currentSeason={currentSeason}
            onLoadingChange={setIsLoading}
          />
        </div>

        {/* Row 2: Search Bar - Always Visible */}
        <div className="mt-3 sm:mt-4">
          <SearchBar isOpen={true} />
        </div>
      </div>
      
      <div className="mt-4 sm:mt-8">
        {isLoading ? <LoadingSkeleton /> : children}
      </div>
    </>
  );
}
