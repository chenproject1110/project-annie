import { Film, Loader2 } from 'lucide-react';
import { fetchAnime, type Season } from '@/lib/anilist';
import { AnimeCard } from '@/components/AnimeCard';

export interface JapandiBrowseAnimeGridProps {
  year: number;
  season: Season;
}

export function JapandiBrowseGridSkeleton() {
  return (
    <div className="space-y-5">
      <div
        className="flex items-start gap-3 rounded-xl border border-white/10 bg-gray-900/40 px-4 py-3"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <Loader2 className="h-5 w-5 shrink-0 animate-spin text-violet-400 mt-0.5" aria-hidden />
        <div>
          <p className="text-sm font-medium text-gray-200">Loading this season&apos;s catalog…</p>
          <p className="text-xs text-gray-500 mt-1 leading-relaxed">
            Large seasons load many pages from MyAnimeList. The grid will appear here as soon as data
            is ready — the app is still working.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="aspect-[2/3] rounded-xl bg-gray-800 animate-pulse" />
        ))}
      </div>
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
