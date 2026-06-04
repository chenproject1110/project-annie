import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

const validStatuses = ['watching', 'completed', 'planning', 'dropped', 'paused'];

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
    const { animeId, status, progress, totalEpisodes, favourite, rewatches, notes } = body;

    if (!animeId || typeof animeId !== 'number') {
      return NextResponse.json({ error: 'Invalid animeId' }, { status: 400 });
    }

    const hasStatus = 'status' in body;
    const hasProgress = progress !== undefined && progress !== null;
    const hasFavourite = typeof favourite === 'boolean';
    const hasRewatches = rewatches !== undefined && rewatches !== null;
    const hasNotes = 'notes' in body;

    // Explicit removal: { animeId, status: null }
    if (hasStatus && status === null) {
      const { error } = await supabase
        .from('anime_tracking')
        .delete()
        .eq('user_id', user.id)
        .eq('anime_id', animeId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      revalidatePath('/profile');
      return NextResponse.json({ deleted: true });
    }

    if (hasStatus && !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }
    if (hasProgress && (!Number.isInteger(progress) || progress < 0)) {
      return NextResponse.json({ error: 'Invalid progress' }, { status: 400 });
    }
    if (hasRewatches && (!Number.isInteger(rewatches) || rewatches < 0)) {
      return NextResponse.json({ error: 'Invalid rewatches' }, { status: 400 });
    }
    if (hasNotes && notes !== null && typeof notes !== 'string') {
      return NextResponse.json({ error: 'Invalid notes' }, { status: 400 });
    }

    if (!hasStatus && !hasProgress && !hasFavourite && !hasRewatches && !hasNotes) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
    }

    const payload: Record<string, unknown> = {
      user_id: user.id,
      anime_id: animeId,
      updated_at: new Date().toISOString(),
    };
    if (hasStatus) payload.status = status;
    if (hasProgress) payload.progress = progress;
    if (typeof totalEpisodes === 'number' && totalEpisodes > 0) payload.total_episodes = totalEpisodes;
    if (hasFavourite) payload.is_favourite = favourite;
    if (hasRewatches) payload.rewatches = rewatches;
    if (hasNotes) payload.notes = notes === '' ? null : notes;

    const { data, error } = await supabase
      .from('anime_tracking')
      .upsert(payload, { onConflict: 'user_id,anime_id' })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    revalidatePath('/profile');
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
