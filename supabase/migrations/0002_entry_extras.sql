-- Roadmap v2 — per-entry extras
-- Private favourite, rewatch count, and free-text notes on a tracked entry.
--
-- HOW TO APPLY: Supabase Dashboard → SQL Editor → paste → Run. (Idempotent.)

alter table public.anime_tracking
  add column if not exists is_favourite boolean not null default false,
  add column if not exists rewatches integer not null default 0,
  add column if not exists notes text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'anime_tracking_rewatches_nonneg'
  ) then
    alter table public.anime_tracking
      add constraint anime_tracking_rewatches_nonneg check (rewatches >= 0);
  end if;
end $$;
