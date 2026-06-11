import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

const VALID = ['watching', 'completed', 'planning', 'dropped', 'paused'];
const CHUNK = 500;

// Higher = "more complete" — used when merging two statuses for the same title.
const STATUS_RANK: Record<string, number> = {
  completed: 5,
  watching: 4,
  paused: 3,
  dropped: 2,
  planning: 1,
};

interface IncomingEntry {
  animeId: number;
  status: string;
  progress?: number;
  totalEpisodes?: number | null;
}

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const entries: IncomingEntry[] = Array.isArray(body?.entries) ? body.entries : [];
    const merge: 'furthest' | 'overwrite' = body?.merge === 'furthest' ? 'furthest' : 'overwrite';
    if (entries.length === 0) {
      return NextResponse.json({ error: 'No entries' }, { status: 400 });
    }

    const valid = entries.filter(
      (e) =>
        typeof e.animeId === 'number' &&
        VALID.includes(e.status) &&
        (e.progress === undefined || (Number.isInteger(e.progress) && e.progress >= 0)),
    );
    if (valid.length === 0) {
      return NextResponse.json({ error: 'No valid entries' }, { status: 400 });
    }

    // For "keep furthest progress", pull existing rows so we never move backward.
    const existing = new Map<number, { status: string; progress: number }>();
    if (merge === 'furthest') {
      const ids = valid.map((e) => e.animeId);
      for (let i = 0; i < ids.length; i += 300) {
        const slice = ids.slice(i, i + 300);
        const { data } = await supabase
          .from('anime_tracking')
          .select('anime_id, status, progress')
          .eq('user_id', user.id)
          .in('anime_id', slice);
        for (const r of data ?? []) {
          existing.set(r.anime_id, { status: r.status, progress: r.progress ?? 0 });
        }
      }
    }

    const now = new Date().toISOString();
    const rows = valid.map((e) => {
      const incomingProgress = typeof e.progress === 'number' ? e.progress : 0;
      const prev = merge === 'furthest' ? existing.get(e.animeId) : undefined;

      const progress = prev ? Math.max(prev.progress, incomingProgress) : incomingProgress;
      const status =
        prev && (STATUS_RANK[prev.status] ?? 0) > (STATUS_RANK[e.status] ?? 0)
          ? prev.status
          : e.status;

      return {
        user_id: user.id,
        anime_id: e.animeId,
        status,
        progress,
        total_episodes:
          typeof e.totalEpisodes === 'number' && e.totalEpisodes > 0 ? e.totalEpisodes : null,
        updated_at: now,
      };
    });

    let imported = 0;
    for (let i = 0; i < rows.length; i += CHUNK) {
      const slice = rows.slice(i, i + CHUNK);
      const { error } = await supabase
        .from('anime_tracking')
        .upsert(slice, { onConflict: 'user_id,anime_id' });
      if (error) {
        return NextResponse.json({ error: error.message, imported }, { status: 500 });
      }
      imported += slice.length;
    }

    revalidatePath('/profile');
    return NextResponse.json({ imported });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
