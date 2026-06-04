import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

const VALID = ['watching', 'completed', 'planning', 'dropped', 'paused'];
const CHUNK = 500;

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
    if (entries.length === 0) {
      return NextResponse.json({ error: 'No entries' }, { status: 400 });
    }

    const now = new Date().toISOString();
    const rows = entries
      .filter(
        (e) =>
          typeof e.animeId === 'number' &&
          VALID.includes(e.status) &&
          (e.progress === undefined || (Number.isInteger(e.progress) && e.progress >= 0)),
      )
      .map((e) => ({
        user_id: user.id,
        anime_id: e.animeId,
        status: e.status,
        progress: typeof e.progress === 'number' ? e.progress : 0,
        total_episodes:
          typeof e.totalEpisodes === 'number' && e.totalEpisodes > 0 ? e.totalEpisodes : null,
        updated_at: now,
      }));

    if (rows.length === 0) {
      return NextResponse.json({ error: 'No valid entries' }, { status: 400 });
    }

    let imported = 0;
    for (let i = 0; i < rows.length; i += CHUNK) {
      const slice = rows.slice(i, i + CHUNK);
      const { error } = await supabase
        .from('anime_tracking')
        .upsert(slice, { onConflict: 'user_id,anime_id' });
      if (error) {
        return NextResponse.json(
          { error: error.message, imported },
          { status: 500 },
        );
      }
      imported += slice.length;
    }

    revalidatePath('/profile');
    return NextResponse.json({ imported });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
