'use client';

import { useMemo, useState } from 'react';
import { Search, Heart } from 'lucide-react';
import { TrackedAnimeCard } from '@/components/TrackedAnimeCard';
import { TRACKING_BADGE, type TrackingStatus } from '@/context/TrackingContext';
import { useTitleLanguage } from '@/context/TitleLanguageContext';

type Filter = TrackingStatus | 'all' | 'favourites';

export interface ProfileItem {
  animeId: number;
  status: TrackingStatus;
  progress: number;
  total: number | null;
  english: string | null;
  romaji: string | null;
  cover: string | null;
  year: number | null;
  updatedAt: string;
  favourite: boolean;
}

type SortKey = 'updated' | 'title' | 'progress' | 'year';
const SORTS: { value: SortKey; label: string }[] = [
  { value: 'updated', label: 'Recently updated' },
  { value: 'title', label: 'Title A–Z' },
  { value: 'progress', label: 'Progress' },
  { value: 'year', label: 'Release year' },
];

const STATUS_ORDER: TrackingStatus[] = ['watching', 'completed', 'planning', 'paused', 'dropped'];

export function ProfileListView({ items }: { items: ProfileItem[] }) {
  const { titleLanguage } = useTitleLanguage();
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('updated');
  const [status, setStatus] = useState<Filter>('all');

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: items.length, favourites: 0 };
    for (const it of items) {
      c[it.status] = (c[it.status] ?? 0) + 1;
      if (it.favourite) c.favourites += 1;
    }
    return c;
  }, [items]);

  const titleOf = (it: ProfileItem) =>
    (titleLanguage === 'romaji'
      ? it.romaji || it.english
      : it.english || it.romaji) || 'Unknown';

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = items.filter((it) =>
      status === 'all' ? true : status === 'favourites' ? it.favourite : it.status === status,
    );
    if (q) {
      list = list.filter(
        (it) =>
          (it.english ?? '').toLowerCase().includes(q) ||
          (it.romaji ?? '').toLowerCase().includes(q),
      );
    }
    const sorted = [...list];
    sorted.sort((a, b) => {
      switch (sort) {
        case 'title':
          return titleOf(a).localeCompare(titleOf(b));
        case 'progress':
          return b.progress - a.progress;
        case 'year':
          return (b.year ?? 0) - (a.year ?? 0);
        default:
          return b.updatedAt.localeCompare(a.updatedAt);
      }
    });
    return sorted;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, query, sort, status, titleLanguage]);

  if (items.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-fg-muted">No anime tracked yet.</p>
        <p className="mt-1 text-sm text-fg-muted">Browse anime, or import your list to get started.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Status tabs */}
      <div className="mb-4 flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {(['all', 'favourites', ...STATUS_ORDER] as const).map((s) => {
          const active = status === s;
          const label =
            s === 'all' ? 'All' : s === 'favourites' ? 'Favourites' : TRACKING_BADGE[s].label;
          const count = counts[s] ?? 0;
          if (s !== 'all' && count === 0) return null;
          return (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              className={`inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium border transition-colors active:scale-95 ${
                active
                  ? 'bg-violet-600 border-violet-400/50 text-white'
                  : 'bg-line/[0.04] border-line/10 text-fg-muted hover:text-fg'
              }`}
            >
              {s === 'favourites' && <Heart className="h-3 w-3" fill="currentColor" />}
              {label} <span className="tabular-nums opacity-70">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Search + sort */}
      <div className="mb-5 flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-muted" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your list"
            className="w-full rounded-xl border border-line/10 bg-line/[0.04] pl-9 pr-3 py-2.5 text-sm text-fg placeholder-fg-muted focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50"
          />
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="rounded-xl border border-line/10 bg-line/[0.04] px-3 py-2.5 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-violet-500/50"
        >
          {SORTS.map((s) => (
            <option key={s.value} value={s.value} className="bg-zinc-900">
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {visible.length === 0 ? (
        <p className="py-12 text-center text-sm text-fg-muted">No matches.</p>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {visible.map((it) => (
            <TrackedAnimeCard
              key={it.animeId}
              animeId={it.animeId}
              animeTitle={it.english}
              animeTitleRomaji={it.romaji}
              coverImageUrl={it.cover}
              favourite={it.favourite}
            />
          ))}
        </div>
      )}
    </div>
  );
}
