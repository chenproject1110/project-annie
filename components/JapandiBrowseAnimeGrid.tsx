import { Film } from 'lucide-react';
import { fetchAnime, type Season } from '@/lib/anilist';
import { AnimeCard } from '@/components/AnimeCard';

export interface JapandiBrowseAnimeGridProps {
  year: number;
  season: Season;
}

export function JapandiBrowseGridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
      {Array.from({ length: 20 }).map((_, i) => (
        <div key={i} className="aspect-[2/3] rounded-xl bg-gray-800 animate-pulse" />
      ))}
    </div>
  );
}

export async function JapandiBrowseAnimeGrid({ year, season }: JapandiBrowseAnimeGridProps) {
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
          <AnimeCard key={anime.mal_id} anime={anime} />
        ))}
      </div>
    );
  } catch {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-red-400">
        <p className="text-xl font-medium">Failed to load anime</p>
        <p className="text-sm mt-2">Please try again later</p>
      </div>
    );
  }
}
