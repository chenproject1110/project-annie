import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { display_name } = body;

  if (typeof display_name !== 'string' || display_name.trim().length === 0) {
    return NextResponse.json({ error: 'display_name is required' }, { status: 400 });
  }

  if (display_name.trim().length > 50) {
    return NextResponse.json({ error: 'display_name too long' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('profiles')
    .update({ display_name: display_name.trim(), updated_at: new Date().toISOString() })
    .eq('id', user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
