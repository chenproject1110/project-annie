import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Building2 } from 'lucide-react';
import {
  searchAnime,
  searchEntities,
  fetchTrendingByPopularity,
  type EntityHit,
  type Anime,
} from '@/lib/anilist';
import { AnimeCard } from '@/components/AnimeCard';
import { SearchBar } from '@/components/SearchBar';

export const metadata: Metadata = {
  title: 'Search — PROJECT ANNIE',
  description: 'Search anime, characters, voice actors and studios. Powered by AniList.',
};

interface SearchParams {
  q?: string;
}

function PeopleRow({
  title,
  hits,
  hrefBase,
}: {
  title: string;
  hits: EntityHit[];
  hrefBase: string;
}) {
  if (hits.length === 0) return null;
  return (
    <section className="mt-10">
      <h2 className="mb-4 text-lg font-bold text-fg sm:text-xl">{title}</h2>
      <div className="flex flex-nowrap gap-4 overflow-x-auto scrollbar-hide pb-2">
        {hits.map((h) => (
          <Link key={h.id} href={`${hrefBase}/${h.id}`} className="group shrink-0 w-20 text-center">
            <div className="relative mx-auto h-20 w-20 overflow-hidden rounded-full ring-2 ring-white/10 group-hover:ring-violet-500/50 bg-surface transition-all">
              {h.image ? (
                <Image src={h.image} alt={h.name} fill sizes="80px" className="object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-fg-muted text-lg">
                  {h.name.charAt(0)}
                </div>
              )}
            </div>
            <p className="mt-2 line-clamp-2 text-xs font-medium text-fg-muted group-hover:text-fg leading-tight">
              {h.name}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default async function SearchPage({ searchParams }: { searchParams: SearchParams }) {
  const q = (searchParams.q ?? '').trim();

  let results: Anime[] = [];
  let entities = { characters: [] as EntityHit[], staff: [] as EntityHit[], studios: [] as EntityHit[] };
  let popular: Anime[] = [];

  if (q) {
    [results, entities] = await Promise.all([searchAnime(q, 30), searchEntities(q)]);
  } else {
    popular = await fetchTrendingByPopularity(18);
  }

  const hasEntities =
    entities.characters.length > 0 || entities.staff.length > 0 || entities.studios.length > 0;

  return (
    <main className="min-h-screen bg-bg">
      <div className="mx-auto max-w-7xl px-8 py-6 sm:py-10">
        <h1 className="text-2xl md:text-4xl font-bold text-fg tracking-tight mb-1">Search</h1>
        <p className="text-fg-muted text-sm sm:text-base mb-5 sm:mb-6">
          Anime, characters, voice actors and studios.
        </p>

        <div className="mb-8">
          <SearchBar isOpen defaultValue={q} />
        </div>

        {!q ? (
          // Recommendations instead of an empty screen.
          <section>
            <h2 className="mb-4 text-lg font-bold text-fg sm:text-xl">Popular right now</h2>
            {popular.length === 0 ? (
              <p className="text-sm text-fg-muted">Start typing to find anime and more.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
                {popular.map((anime) => (
                  <AnimeCard key={anime.id} anime={anime} />
                ))}
              </div>
            )}
          </section>
        ) : results.length === 0 && !hasEntities ? (
          <div className="flex flex-col items-center justify-center py-20 text-fg-muted">
            <p className="text-lg font-medium">No results for &ldquo;{q}&rdquo;</p>
            <p className="text-sm mt-2 text-fg-muted">Try a different spelling or a shorter term.</p>
          </div>
        ) : (
          <>
            {results.length > 0 && (
              <>
                <p className="text-sm text-fg-muted mb-4">
                  {results.length} title{results.length === 1 ? '' : 's'} for &ldquo;{q}&rdquo;
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
                  {results.map((anime) => (
                    <AnimeCard key={anime.id} anime={anime} />
                  ))}
                </div>
              </>
            )}

            <PeopleRow title="Characters" hits={entities.characters} hrefBase="/character" />
            <PeopleRow title="Voice actors" hits={entities.staff} hrefBase="/staff" />

            {entities.studios.length > 0 && (
              <section className="mt-10">
                <h2 className="mb-4 text-lg font-bold text-fg sm:text-xl">Studios</h2>
                <div className="flex flex-wrap gap-2">
                  {entities.studios.map((s) => (
                    <Link
                      key={s.id}
                      href={`/studio/${s.id}`}
                      className="inline-flex items-center gap-2 rounded-full border border-line/10 bg-line/[0.04] px-4 py-2 text-sm text-fg-muted hover:text-fg hover:border-violet-500/40 transition-colors"
                    >
                      <Building2 className="h-4 w-4 text-violet-400" />
                      {s.name}
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}
