'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { toast } from 'sonner';
import { Plus, Check, Play } from 'lucide-react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { anilistQuery } from '@/lib/anilist';
import { useTitleLanguage } from '@/context/TitleLanguageContext';

interface RailItem {
  animeId: number;
  progress: number;
  total: number | null;
  romaji: string | null;
  english: string | null;
  cover: string | null;
}

interface TrackingRow {
  anime_id: number;
  progress: number | null;
  total_episodes: number | null;
}

interface AniListMedia {
  id: number;
  title: { romaji: string; english: string | null };
  coverImage: { large: string | null };
}

interface AniListBatch {
  Page: { media: AniListMedia[] };
}

const WRITE_DEBOUNCE_MS = 500;
const MAX_ITEMS = 12;

export function ContinueWatchingRail() {
  const reduceMotion = useReducedMotion();
  const { titleLanguage } = useTitleLanguage();
  const [items, setItems] = useState<RailItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  const committedRef = useRef<Record<number, number>>({});
  const timersRef = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoaded(true);
      return;
    }
    let cancelled = false;

    (async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user || cancelled) {
          setLoaded(true);
          return;
        }

        const { data, error } = await supabase
          .from('anime_tracking')
          .select('anime_id, progress, total_episodes')
          .eq('user_id', user.id)
          .eq('status', 'watching')
          .order('updated_at', { ascending: false });

        if (error || cancelled || !data) {
          setLoaded(true);
          return;
        }

        const rows = (data as TrackingRow[])
          // "Continue watching" = started or in-progress, not yet caught up.
          .filter((r) => r.total_episodes == null || (r.progress ?? 0) < r.total_episodes)
          .slice(0, MAX_ITEMS);

        if (rows.length === 0) {
          setLoaded(true);
          return;
        }

        const ids = rows.map((r) => r.anime_id);
        let mediaMap = new Map<number, AniListMedia>();
        try {
          const res = await anilistQuery<AniListBatch>(
            `query ($ids: [Int]) {
              Page(page: 1, perPage: 50) {
                media(id_in: $ids, type: ANIME) {
                  id
                  title { romaji english }
                  coverImage { large }
                }
              }
            }`,
            { ids }
          );
          mediaMap = new Map(res.Page.media.map((m) => [m.id, m]));
        } catch {
          // titles/covers will fall back to placeholders
        }

        if (cancelled) return;

        const built: RailItem[] = rows.map((r) => {
          const m = mediaMap.get(r.anime_id);
          committedRef.current[r.anime_id] = r.progress ?? 0;
          return {
            animeId: r.anime_id,
            progress: r.progress ?? 0,
            total: r.total_episodes ?? null,
            romaji: m?.title.romaji ?? null,
            english: m?.title.english ?? null,
            cover: m?.coverImage.large ?? null,
          };
        });

        setItems(built);
        setLoaded(true);
      } catch {
        setLoaded(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const flush = useCallback((animeId: number, value: number, total: number | null) => {
    fetch('/api/tracking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ animeId, progress: value, totalEpisodes: total ?? undefined }),
    })
      .then((res) => {
        if (!res.ok) throw new Error();
        committedRef.current[animeId] = value;
      })
      .catch(() => {
        toast.error('Failed to save progress');
        setItems((curr) =>
          curr.map((it) =>
            it.animeId === animeId ? { ...it, progress: committedRef.current[animeId] ?? 0 } : it
          )
        );
      });
  }, []);

  const bump = useCallback(
    (animeId: number) => {
      setItems((curr) =>
        curr.map((it) => {
          if (it.animeId !== animeId) return it;
          const cap = it.total && it.total > 0 ? it.total : null;
          const next = cap != null ? Math.min(it.progress + 1, cap) : it.progress + 1;
          if (next === it.progress) return it;

          if (timersRef.current[animeId]) clearTimeout(timersRef.current[animeId]);
          timersRef.current[animeId] = setTimeout(
            () => flush(animeId, next, it.total),
            WRITE_DEBOUNCE_MS
          );
          if (cap != null && next >= cap) {
            toast.success('Caught up!');
          }
          return { ...it, progress: next };
        })
      );
    },
    [flush]
  );

  useEffect(() => {
    return () => {
      Object.values(timersRef.current).forEach(clearTimeout);
    };
  }, []);

  if (!loaded || items.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-8 pt-6 pb-2" aria-labelledby="continue-watching-heading">
      <div className="mb-4 flex items-end gap-2">
        <Play className="h-5 w-5 text-violet-400" aria-hidden />
        <h2
          id="continue-watching-heading"
          className="text-2xl md:text-4xl font-bold text-white tracking-tight"
        >
          Continue watching
        </h2>
      </div>

      <div className="flex flex-nowrap gap-[0.75rem] overflow-x-auto pb-3 scrollbar-hide snap-x snap-mandatory scroll-smooth">
        {items.map((it) => {
          const title =
            titleLanguage === 'romaji'
              ? it.romaji || it.english || 'Unknown'
              : it.english || it.romaji || 'Unknown';
          const cap = it.total && it.total > 0 ? it.total : null;
          const atMax = cap != null && it.progress >= cap;
          const pct = cap != null ? Math.min(100, Math.round((it.progress / cap) * 100)) : 0;

          return (
            <div
              key={it.animeId}
              className="w-[42vw] max-w-[168px] shrink-0 snap-start"
            >
              <Link
                href={`/anime/${it.animeId}`}
                className="group relative block aspect-[2/3] overflow-hidden rounded-xl bg-gray-800 shadow-lg active:scale-95 transition-transform"
              >
                {it.cover ? (
                  <Image
                    src={it.cover}
                    alt={title}
                    fill
                    sizes="(max-width: 640px) 42vw, 168px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gray-700">
                    <span className="text-xs text-gray-500">No Image</span>
                  </div>
                )}
                {cap != null && (
                  <div className="absolute inset-x-0 bottom-0 z-[4] h-1 bg-black/50">
                    <div
                      className={`h-full ${atMax ? 'bg-emerald-400' : 'bg-violet-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                )}
              </Link>

              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-gray-300 tabular-nums">
                  {it.progress}
                  <span className="text-gray-500"> / {cap ?? '?'}</span>
                </span>
                <motion.button
                  type="button"
                  onClick={() => bump(it.animeId)}
                  disabled={atMax}
                  whileTap={reduceMotion ? undefined : { scale: 0.9 }}
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-violet-400/30 bg-violet-600 text-white shadow-[0_0_10px_rgba(139,92,246,0.35)] hover:bg-violet-500 disabled:opacity-40 transition-colors"
                  aria-label={atMax ? 'Caught up' : `Mark episode ${it.progress + 1} of ${title} watched`}
                >
                  {atMax ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                </motion.button>
              </div>

              <p className="mt-1 line-clamp-2 text-xs font-medium leading-tight text-white">
                {title}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
