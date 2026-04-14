import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

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
    const { animeId, status } = body;

    if (!animeId || typeof animeId !== 'number') {
      return NextResponse.json({ error: 'Invalid animeId' }, { status: 400 });
    }

    if (status === null) {
      const { error } = await supabase
        .from('anime_tracking')
        .delete()
        .eq('user_id', user.id)
        .eq('anime_id', animeId);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      revalidatePath('/profile');
      return NextResponse.json({ deleted: true });
    }

    const validStatuses = ['watching', 'completed', 'planning', 'dropped', 'paused'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('anime_tracking')
      .upsert(
        {
          user_id: user.id,
          anime_id: animeId,
          status,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,anime_id' }
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    revalidatePath('/profile');
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
