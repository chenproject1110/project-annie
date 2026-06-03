'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';

const GENRES = [
  'Action',
  'Adventure',
  'Comedy',
  'Drama',
  'Ecchi',
  'Fantasy',
  'Horror',
  'Mahou Shoujo',
  'Mecha',
  'Music',
  'Mystery',
  'Psychological',
  'Romance',
  'Sci-Fi',
  'Slice of Life',
  'Sports',
  'Supernatural',
  'Thriller',
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
  const [, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const activeGenres = parseList(searchParams.get('genres'));
  const activeFormats = parseList(searchParams.get('formats'));
  const activeCount = activeGenres.length + activeFormats.length;

  const apply = (key: 'genres' | 'formats', next: string[]) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next.length > 0) params.set(key, next.join(','));
    else params.delete(key);
    startTransition(() => router.push(`/browse?${params.toString()}`));
  };

  const toggle = (key: 'genres' | 'formats', value: string, current: string[]) => {
    apply(key, current.includes(value) ? current.filter((v) => v !== value) : [...current, value]);
  };

  const clearAll = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('genres');
    params.delete('formats');
    startTransition(() => router.push(`/browse?${params.toString()}`));
  };

  const chip = (active: boolean) =>
    `shrink-0 rounded-full px-3 py-1.5 text-xs sm:text-sm font-medium border transition-all active:scale-95 ${
      active
        ? 'bg-violet-600 border-violet-400/50 text-white shadow-sm shadow-violet-500/30'
        : 'bg-white/[0.04] border-white/10 text-gray-300 hover:text-white hover:border-white/20'
    }`;

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
              : 'bg-white/[0.04] border-white/10 text-gray-300 hover:text-white'
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
            className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-3.5 w-3.5" />
            Clear
          </button>
        )}
      </div>

      {open && (
        <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-md">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Format</p>
          <div className="mb-4 flex flex-wrap gap-2">
            {FORMATS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => toggle('formats', f.value, activeFormats)}
                className={chip(activeFormats.includes(f.value))}
              >
                {f.label}
              </button>
            ))}
          </div>

          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Genre</p>
          <div className="flex flex-wrap gap-2">
            {GENRES.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => toggle('genres', g, activeGenres)}
                className={chip(activeGenres.includes(g))}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
