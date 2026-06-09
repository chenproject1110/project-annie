import Link from 'next/link';
import { Clock, Film, Layers } from 'lucide-react';

export interface ProfileStatsData {
  totalTitles: number;
  episodesWatched: number;
  hoursWatched: number;
  topGenres: { name: string; count: number }[];
  topStudios: { name: string; count: number; id: number | null }[];
}

function fmt(n: number): string {
  return n.toLocaleString('en-US');
}

export function ProfileStats({ stats }: { stats: ProfileStatsData }) {
  if (stats.totalTitles === 0) return null;

  const genreMax = Math.max(1, ...stats.topGenres.map((g) => g.count));
  const days = Math.floor(stats.hoursWatched / 24);

  return (
    <section className="mb-10">
      <h2 className="mb-4 text-lg font-bold text-fg sm:text-xl">Your stats</h2>

      {/* Top numbers */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-line/10 bg-line/[0.03] p-4">
          <Film className="h-4 w-4 text-violet-400 mb-2" />
          <p className="text-2xl font-bold text-fg tabular-nums">{fmt(stats.totalTitles)}</p>
          <p className="text-xs text-fg-muted">Titles</p>
        </div>
        <div className="rounded-xl border border-line/10 bg-line/[0.03] p-4">
          <Layers className="h-4 w-4 text-violet-400 mb-2" />
          <p className="text-2xl font-bold text-fg tabular-nums">{fmt(stats.episodesWatched)}</p>
          <p className="text-xs text-fg-muted">Episodes</p>
        </div>
        <div className="rounded-xl border border-line/10 bg-line/[0.03] p-4">
          <Clock className="h-4 w-4 text-violet-400 mb-2" />
          <p className="text-2xl font-bold text-fg tabular-nums">{fmt(stats.hoursWatched)}</p>
          <p className="text-xs text-fg-muted">Hours{days > 0 ? ` · ${days}d` : ''}</p>
        </div>
      </div>

      {/* Genre breakdown + top studios */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {stats.topGenres.length > 0 && (
          <div className="rounded-xl border border-line/10 bg-line/[0.03] p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-fg-muted">
              Top genres
            </p>
            <div className="space-y-2">
              {stats.topGenres.map((g) => (
                <div key={g.name}>
                  <div className="flex justify-between text-xs text-fg-muted mb-1">
                    <span>{g.name}</span>
                    <span className="tabular-nums text-fg-muted">{g.count}</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-line/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-400"
                      style={{ width: `${Math.round((g.count / genreMax) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {stats.topStudios.length > 0 && (
          <div className="rounded-xl border border-line/10 bg-line/[0.03] p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-fg-muted">
              Top studios
            </p>
            <ul className="space-y-2">
              {stats.topStudios.map((s) => (
                <li key={s.name} className="flex items-center justify-between text-sm">
                  {s.id ? (
                    <Link href={`/studio/${s.id}`} className="text-fg-muted hover:text-violet-300 transition-colors">
                      {s.name}
                    </Link>
                  ) : (
                    <span className="text-fg-muted">{s.name}</span>
                  )}
                  <span className="tabular-nums text-fg-muted">{s.count}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
