import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import { Play, CheckCircle, Bookmark, XCircle, Pause } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { anilistQuery } from '@/lib/anilist';
import { ProfileDisplayNameEditor } from '@/components/ProfileDisplayNameEditor';
import { TrackedAnimeCard } from '@/components/TrackedAnimeCard';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'My Profile - PROJECT ANNIE',
};

type TrackingStatus = 'watching' | 'completed' | 'planning' | 'dropped' | 'paused';

interface TrackingRow {
  anime_id: number;
  status: TrackingStatus;
}

interface AniListBasicMedia {
  id: number;
  title: { romaji: string; english: string | null };
  coverImage: { large: string | null };
}

interface AniListBatchResponse {
  Page: {
    media: AniListBasicMedia[];
  };
}

const STATUS_META: Record<
  TrackingStatus,
  { label: string; icon: typeof Play; color: string; bg: string; border: string }
> = {
  watching: {
    label: 'Watching',
    icon: Play,
    color: 'text-violet-400',
    bg: 'bg-violet-500/15',
    border: 'border-violet-500/25',
  },
  completed: {
    label: 'Completed',
    icon: CheckCircle,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/15',
    border: 'border-emerald-500/25',
  },
  planning: {
    label: 'Planning',
    icon: Bookmark,
    color: 'text-blue-400',
    bg: 'bg-blue-500/15',
    border: 'border-blue-500/25',
  },
  dropped: {
    label: 'Dropped',
    icon: XCircle,
    color: 'text-red-400',
    bg: 'bg-red-500/15',
    border: 'border-red-500/25',
  },
  paused: {
    label: 'Paused',
    icon: Pause,
    color: 'text-amber-400',
    bg: 'bg-amber-500/15',
    border: 'border-amber-500/25',
  },
};

const STATUS_ORDER: TrackingStatus[] = ['watching', 'completed', 'planning', 'paused', 'dropped'];

export default async function ProfilePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, avatar_url')
    .eq('id', user.id)
    .single();

  const { data: trackingRows } = await supabase
    .from('anime_tracking')
    .select('anime_id, status')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  const rows = (trackingRows || []) as TrackingRow[];

  const animeIds = rows.map((r) => r.anime_id);
  const animeMap = new Map<number, AniListBasicMedia>();

  if (animeIds.length > 0) {
    try {
      const data = await anilistQuery<AniListBatchResponse>(
        `query ($ids: [Int]) {
          Page(page: 1, perPage: 50) {
            media(id_in: $ids, type: ANIME) {
              id
              title { romaji english }
              coverImage { large }
            }
          }
        }`,
        { ids: animeIds },
      );
      for (const m of data.Page.media) {
        animeMap.set(m.id, m);
      }
    } catch {
      // AniList unavailable — cards will show fallback text
    }
  }

  const grouped: Record<TrackingStatus, TrackingRow[]> = {
    watching: [],
    completed: [],
    planning: [],
    dropped: [],
    paused: [],
  };
  for (const row of rows) {
    grouped[row.status]?.push(row);
  }

  const displayName = profile?.display_name || user.email || 'User';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <main className="relative z-0 min-h-screen bg-[#0a0a0a] pb-16">
      <div className="mx-auto max-w-4xl px-8 pt-12 sm:pt-16">
        {/* Avatar */}
        <div className="flex justify-center mb-4">
          <div className="flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-purple-900 shadow-[0_0_24px_rgba(139,92,246,0.3)] ring-2 ring-white/10">
            <span className="text-4xl font-bold text-white select-none">{initial}</span>
          </div>
        </div>

        {/* Display Name Editor */}
        <div className="mb-2">
          <ProfileDisplayNameEditor initialName={displayName} />
        </div>

        <p className="mb-8 text-center text-sm text-gray-500">{user.email}</p>

        {/* Stats Cards */}
        <div className="mb-10 flex gap-3 overflow-x-auto scrollbar-hide pb-2">
          {STATUS_ORDER.map((status) => {
            const meta = STATUS_META[status];
            const Icon = meta.icon;
            const count = grouped[status].length;
            return (
              <div
                key={status}
                className={`flex shrink-0 items-center gap-2.5 rounded-xl border px-4 py-3 backdrop-blur-md ${meta.bg} ${meta.border}`}
              >
                <Icon className={`h-4 w-4 ${meta.color}`} />
                <div className="flex flex-col">
                  <span className="text-xs text-gray-400">{meta.label}</span>
                  <span className="text-sm font-semibold text-white">{count}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Anime Rows by Status */}
        {STATUS_ORDER.map((status) => {
          const items = grouped[status];
          if (items.length === 0) return null;
          const meta = STATUS_META[status];

          return (
            <section key={status} className="mb-10">
              <h2 className="mb-4 text-lg font-bold text-white sm:text-xl">
                {status === 'watching' ? 'Currently Watching' : meta.label}
              </h2>
              <div className="flex flex-nowrap gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-smooth pb-3">
                {items.map((row) => {
                  const info = animeMap.get(row.anime_id);
                  return (
                    <div
                      key={row.anime_id}
                      className="w-[42vw] max-w-[168px] shrink-0 snap-start"
                    >
                      <TrackedAnimeCard
                        animeId={row.anime_id}
                        animeTitle={info?.title.english ?? null}
                        animeTitleRomaji={info?.title.romaji ?? null}
                        coverImageUrl={info?.coverImage.large ?? null}
                      />
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}

        {rows.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-gray-500">No anime tracked yet.</p>
            <p className="mt-1 text-sm text-gray-600">
              Browse anime and start building your list!
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
