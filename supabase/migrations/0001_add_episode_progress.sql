-- Phase 1.1 — Episode progress tracking
-- Adds per-row episode progress and a cached total episode count so that
-- "continue watching" and progress bars can render without an extra AniList call.
--
-- HOW TO APPLY:
--   Supabase Dashboard → SQL Editor → paste this file → Run.
--   (Safe to run more than once — guarded with IF NOT EXISTS.)

alter table public.anime_tracking
  add column if not exists progress integer not null default 0,
  add column if not exists total_episodes integer;

-- Defensive: never allow negative progress.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'anime_tracking_progress_nonneg'
  ) then
    alter table public.anime_tracking
      add constraint anime_tracking_progress_nonneg check (progress >= 0);
  end if;
end $$;
