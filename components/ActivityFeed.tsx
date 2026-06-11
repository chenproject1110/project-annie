'use client';

import Link from 'next/link';
import { TRACKING_BADGE } from '@/context/TrackingContext';
import { useTitleLanguage } from '@/context/TitleLanguageContext';
import type { ProfileItem } from '@/components/ProfileListView';

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  const w = Math.floor(d / 7);
  if (w < 5) return `${w}w ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.floor(d / 365)}y ago`;
}

export function ActivityFeed({ items }: { items: ProfileItem[] }) {
  const { titleLanguage } = useTitleLanguage();
  const recent = [...items]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 5);
  if (recent.length === 0) return null;

  return (
    <section className="mb-10">
      <h2 className="mb-4 text-lg font-bold text-fg sm:text-xl">Recent activity</h2>
      <ul className="divide-y divide-line/10 overflow-hidden rounded-2xl border border-line/10 bg-line/[0.03]">
        {recent.map((it) => {
          const title =
            (titleLanguage === 'romaji'
              ? it.romaji || it.english
              : it.english || it.romaji) || 'Unknown';
          const badge = TRACKING_BADGE[it.status];
          const Icon = badge.icon;
          const sub =
            it.total != null
              ? `${badge.label} · ${it.progress}/${it.total}`
              : it.progress > 0
                ? `${badge.label} · ${it.progress} ep`
                : badge.label;
          return (
            <li key={it.animeId}>
              <Link
                href={`/anime/${it.animeId}`}
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-line/[0.04]"
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${badge.bg} ${badge.border}`}
                >
                  <Icon className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-fg">{title}</span>
                  <span className="block text-xs text-fg-muted">{sub}</span>
                </span>
                <span className="shrink-0 text-xs text-fg-muted">{relTime(it.updatedAt)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
