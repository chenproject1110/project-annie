import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { fetchTrackedMediaInfo, type TrackedMediaInfo } from '@/lib/anilist';
import { ProfileDisplayNameEditor } from '@/components/ProfileDisplayNameEditor';
import { ProfileStats, type ProfileStatsData } from '@/components/ProfileStats';
import { ProfileListView, type ProfileItem } from '@/components/ProfileListView';
import { ScrollToTopButton } from '@/components/ScrollToTopButton';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'My Profile - PROJECT ANNIE',
};

type TrackingStatus = 'watching' | 'completed' | 'planning' | 'dropped' | 'paused';

interface TrackingRow {
  anime_id: number;
  status: TrackingStatus;
  progress: number | null;
  total_episodes: number | null;
  updated_at: string;
  is_favourite?: boolean | null;
}

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

  // Staged fallback so the page works on any migration level.
  let rows: TrackingRow[] = [];
  const full = await supabase
    .from('anime_tracking')
    .select('anime_id, status, progress, total_episodes, updated_at, is_favourite')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });
  if (!full.error) {
    rows = (full.data ?? []) as TrackingRow[];
  } else {
    const mid = await supabase
      .from('anime_tracking')
      .select('anime_id, status, progress, total_episodes, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });
    if (!mid.error) {
      rows = (mid.data ?? []) as TrackingRow[];
    } else {
      const basic = await supabase
        .from('anime_tracking')
        .select('anime_id, status, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
      rows = (basic.data ?? []).map((r) => ({
        anime_id: r.anime_id,
        status: r.status,
        progress: 0,
        total_episodes: null,
        updated_at: r.updated_at,
      })) as TrackingRow[];
    }
  }

  const ids = rows.map((r) => r.anime_id);
  let mediaMap = new Map<number, TrackedMediaInfo>();
  try {
    mediaMap = await fetchTrackedMediaInfo(ids);
  } catch {
    // AniList unavailable — cards/stats fall back gracefully
  }

  // Build list items.
  const items: ProfileItem[] = rows.map((r) => {
    const info = mediaMap.get(r.anime_id);
    return {
      animeId: r.anime_id,
      status: r.status,
      progress: r.progress ?? 0,
      total: r.total_episodes ?? info?.episodes ?? null,
      english: info?.title.english ?? null,
      romaji: info?.title.romaji ?? null,
      cover: info?.cover ?? null,
      year: info?.seasonYear ?? null,
      updatedAt: r.updated_at,
      favourite: Boolean(r.is_favourite),
    };
  });

  // Compute stats.
  let episodesWatched = 0;
  let minutesWatched = 0;
  const genreCount = new Map<string, number>();
  const studioCount = new Map<string, { count: number; id: number | null }>();

  for (const r of rows) {
    const info = mediaMap.get(r.anime_id);
    const totalEps = r.total_episodes ?? info?.episodes ?? 0;
    const watched =
      (r.progress ?? 0) > 0
        ? (r.progress as number)
        : r.status === 'completed'
          ? totalEps
          : 0;
    episodesWatched += watched;
    minutesWatched += watched * (info?.duration ?? 24);

    if (info) {
      for (const g of info.genres) genreCount.set(g, (genreCount.get(g) ?? 0) + 1);
      if (info.studio) {
        const prev = studioCount.get(info.studio.name);
        studioCount.set(info.studio.name, {
          count: (prev?.count ?? 0) + 1,
          id: info.studio.id,
        });
      }
    }
  }

  const stats: ProfileStatsData = {
    totalTitles: rows.length,
    episodesWatched,
    hoursWatched: Math.round(minutesWatched / 60),
    topGenres: [...genreCount.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6),
    topStudios: [...studioCount.entries()]
      .map(([name, v]) => ({ name, count: v.count, id: v.id }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5),
  };

  const displayName = profile?.display_name || user.email || 'User';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <main id="profile-top" className="relative z-0 min-h-screen bg-[#0a0a0a] pb-16 scroll-mt-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-8 pt-12 sm:pt-16">
        {/* Avatar */}
        <div className="flex justify-center mb-4">
          <div className="flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-purple-900 shadow-[0_0_24px_rgba(139,92,246,0.3)] ring-2 ring-white/10">
            <span className="text-4xl font-bold text-white select-none">{initial}</span>
          </div>
        </div>

        <div className="mb-2">
          <ProfileDisplayNameEditor initialName={displayName} />
        </div>

        <p className="mb-3 text-center text-sm text-gray-500">{user.email}</p>

        <div className="mb-8 flex justify-center gap-2">
          <a
            href="/import"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-medium text-gray-300 hover:text-white hover:border-white/20 transition-colors"
          >
            Import from AniList
          </a>
          <a
            href="/settings"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-medium text-gray-300 hover:text-white hover:border-white/20 transition-colors"
          >
            Settings
          </a>
        </div>

        <ProfileStats stats={stats} />

        <ProfileListView items={items} />
      </div>

      <ScrollToTopButton />
    </main>
  );
}
