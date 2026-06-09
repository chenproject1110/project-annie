'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SlidersHorizontal, X, Search, Building2 } from 'lucide-react';
import { searchStudios } from '@/lib/anilist';

const GENRES = [
  'Action', 'Adventure', 'Comedy', 'Drama', 'Ecchi', 'Fantasy', 'Horror',
  'Mahou Shoujo', 'Mecha', 'Music', 'Mystery', 'Psychological', 'Romance',
  'Sci-Fi', 'Slice of Life', 'Sports', 'Supernatural', 'Thriller',
] as const;

const FORMATS: { value: string; label: string }[] = [
  { value: 'TV', label: 'TV' },
  { value: 'TV_SHORT', label: 'TV Short' },
  { value: 'MOVIE', label: 'Movie' },
  { value: 'OVA', label: 'OVA' },
  { value: 'ONA', label: 'ONA' },
  { value: 'SPECIAL', label: 'Special' },
  { value: 'MUSIC', label: 'Music' },
];

function parseList(value: string | null): string[] {
  return value ? value.split(',').filter(Boolean) : [];
}

export function BrowseFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);

  const [studioQuery, setStudioQuery] = useState('');
  const [studioResults, setStudioResults] = useState<{ id: number; name: string }[]>([]);
  const studioTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeGenres = parseList(searchParams.get('genres'));
  const activeFormats = parseList(searchParams.get('formats'));
  const activeStudio = searchParams.get('studio');
  const activeCount = activeGenres.length + activeFormats.length + (activeStudio ? 1 : 0);

  // Debounced studio search.
  useEffect(() => {
    if (studioTimer.current) clearTimeout(studioTimer.current);
    if (!studioQuery.trim()) {
      setStudioResults([]);
      return;
    }
    studioTimer.current = setTimeout(async () => {
      setStudioResults(await searchStudios(studioQuery));
    }, 300);
    return () => {
      if (studioTimer.current) clearTimeout(studioTimer.current);
    };
  }, [studioQuery]);

  const setParam = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/browse?${params.toString()}`);
  };

  const toggleList = (key: 'genres' | 'formats', value: string, current: string[]) => {
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    setParam(key, next.length > 0 ? next.join(',') : null);
  };

  const pickStudio = (name: string) => {
    setStudioQuery('');
    setStudioResults([]);
    setParam('studio', name);
  };

  const clearAll = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('genres');
    params.delete('formats');
    params.delete('studio');
    router.push(`/browse?${params.toString()}`);
  };

  const chip = (active: boolean) =>
    `shrink-0 rounded-full px-3 py-1.5 text-xs sm:text-sm font-medium border transition-all active:scale-95 ${
      active
        ? 'bg-violet-600 border-violet-400/50 text-white shadow-sm shadow-violet-500/30'
        : 'bg-line/[0.04] border-line/10 text-fg-muted hover:text-fg hover:border-line/20'
    }`;

  const panelContent = (
    <div className="space-y-4">
      {/* Studio */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-fg-muted">Studio</p>
        {activeStudio ? (
          <div className="inline-flex items-center gap-2 rounded-full bg-violet-600 px-3 py-1.5 text-xs font-medium text-white">
            <Building2 className="h-3.5 w-3.5" />
            {activeStudio}
            <button type="button" onClick={() => setParam('studio', null)} aria-label="Clear studio">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-muted" />
            <input
              type="text"
              value={studioQuery}
              onChange={(e) => setStudioQuery(e.target.value)}
              placeholder="Search studios…"
              className="w-full rounded-xl border border-line/10 bg-line/[0.04] pl-9 pr-3 py-2.5 text-sm text-fg placeholder-fg-muted focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50"
            />
            {studioResults.length > 0 && (
              <ul className="absolute z-[130] mt-1 max-h-52 w-full overflow-y-auto rounded-xl border border-line/10 bg-[#101013] py-1 shadow-2xl">
                {studioResults.map((s) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => pickStudio(s.name)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-fg-muted hover:bg-line/[0.06]"
                    >
                      <Building2 className="h-4 w-4 text-violet-400 shrink-0" />
                      {s.name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Format */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-fg-muted">Format</p>
        <div className="flex flex-wrap gap-2">
          {FORMATS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => toggleList('formats', f.value, activeFormats)}
              className={chip(activeFormats.includes(f.value))}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Genre */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-fg-muted">Genre</p>
        <div className="flex flex-wrap gap-2">
          {GENRES.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => toggleList('genres', g, activeGenres)}
              className={chip(activeGenres.includes(g))}
            >
              {g}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className={`inline-flex min-h-9 items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium border transition-colors active:scale-95 ${
            open || activeCount > 0
              ? 'bg-violet-600/15 border-violet-500/40 text-white'
              : 'bg-line/[0.04] border-line/10 text-fg-muted hover:text-fg'
          }`}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {activeCount > 0 && (
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-violet-600 px-1 text-[11px] font-bold text-white">
              {activeCount}
            </span>
          )}
        </button>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="inline-flex items-center gap-1 text-xs text-fg-muted hover:text-fg transition-colors"
          >
            <X className="h-3.5 w-3.5" />
            Clear
          </button>
        )}
      </div>

      {open && (
        <>
          {/* Desktop: inline panel */}
          <div className="hidden sm:block mt-3 rounded-2xl border border-line/10 bg-line/[0.03] p-4 backdrop-blur-md">
            {panelContent}
          </div>

          {/* Mobile: bottom sheet */}
          <div className="sm:hidden">
            <button
              type="button"
              aria-label="Close filters"
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm"
            />
            <div className="fixed inset-x-0 bottom-0 z-[120] max-h-[82vh] overflow-y-auto rounded-t-3xl border-t border-line/10 bg-[#0e0e11] px-5 pt-3 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] shadow-[0_-12px_40px_rgba(0,0,0,0.5)]">
              <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/15" aria-hidden />
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-base font-bold text-white">Filters</h3>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-line/[0.06] text-fg-muted"
                  aria-label="Done"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              {panelContent}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
