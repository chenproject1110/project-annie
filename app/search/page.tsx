import type { Metadata } from 'next';
import { Search as SearchIcon } from 'lucide-react';
import { searchAnime } from '@/lib/anilist';
import { AnimeCard } from '@/components/AnimeCard';
import { SearchBar } from '@/components/SearchBar';

export const metadata: Metadata = {
  title: 'Search — PROJECT ANNIE',
  description: 'Search anime by title. Powered by AniList.',
};

interface SearchParams {
  q?: string;
}

export default async function SearchPage({ searchParams }: { searchParams: SearchParams }) {
  const q = (searchParams.q ?? '').trim();
  const results = q ? await searchAnime(q, 30) : [];

  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      <div className="mx-auto max-w-7xl px-8 py-6 sm:py-10">
        <h1 className="text-2xl md:text-4xl font-bold text-white tracking-tight mb-1">Search</h1>
        <p className="text-gray-400 text-sm sm:text-base mb-5 sm:mb-6">
          Type a title and press Enter — partial matches welcome.
        </p>

        <div className="mb-8">
          <SearchBar isOpen autoFocus defaultValue={q} />
        </div>

        {!q ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <SearchIcon className="w-12 h-12 mb-4 opacity-40" />
            <p className="text-sm">Start typing to find anime.</p>
          </div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <p className="text-lg font-medium">No results for &ldquo;{q}&rdquo;</p>
            <p className="text-sm mt-2 text-gray-500">Try a different spelling or a shorter term.</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-4">
              {results.length} result{results.length === 1 ? '' : 's'} for &ldquo;{q}&rdquo;
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
              {results.map((anime) => (
                <AnimeCard key={anime.id} anime={anime} />
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
