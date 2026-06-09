'use client';

import { useEffect, useState } from 'react';
import {
  fetchRecommendationsForIds,
  fetchAiringPopular,
  type Anime,
} from '@/lib/anilist';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { AnimeCard } from '@/components/AnimeCard';

type Mode = 'personal' | 'popular';

export function RecommendationsRail() {
  const [items, setItems] = useState<Anime[]>([]);
  const [mode, setMode] = useState<Mode>('popular');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const fallback = async () => {
        const popular = await fetchAiringPopular(12);
        if (!cancelled) {
          setItems(popular);
          setMode('popular');
          setLoaded(true);
        }
      };

      try {
        if (!isSupabaseConfigured()) return void (await fallback());

        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return void (await fallback());

        const { data: rows } = await supabase
          .from('anime_tracking')
          .select('anime_id, status, updated_at')
          .eq('user_id', user.id)
          .in('status', ['watching', 'completed', 'paused'])
          .order('updated_at', { ascending: false });

        const ids = (rows ?? []).map((r) => r.anime_id as number);
        if (ids.length === 0) return void (await fallback());

        const recs = await fetchRecommendationsForIds(ids, 12);
        if (cancelled) return;

        if (recs.length > 0) {
          setItems(recs);
          setMode('personal');
          setLoaded(true);
        } else {
          await fallback();
        }
      } catch {
        if (!cancelled) await fallback();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loaded && items.length === 0) return null;

  const heading = mode === 'personal' ? 'Recommended for you' : 'Popular right now';
  const subtitle =
    mode === 'personal' ? 'Based on what you’re tracking' : 'Currently airing favourites';

  return (
    <section className="mx-auto max-w-7xl px-8 pb-10 sm:pb-14" aria-labelledby="recs-heading">
      <div className="mb-4 md:mb-6">
        <h2 id="recs-heading" className="text-2xl md:text-4xl font-bold text-fg tracking-tight">
          {heading}
        </h2>
        <p className="text-fg-muted text-sm sm:text-base mt-1">{subtitle}</p>
      </div>

      {!loaded ? (
        <div className="flex flex-nowrap md:grid md:grid-cols-6 gap-[0.75rem] overflow-hidden pb-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="w-[42vw] max-w-[168px] shrink-0 md:w-auto md:max-w-none aspect-[2/3] rounded-xl bg-line/5 animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-nowrap md:grid md:grid-cols-6 gap-[0.75rem] overflow-x-auto md:overflow-visible pb-3 scrollbar-hide snap-x snap-mandatory md:snap-none scroll-smooth">
          {items.map((anime) => (
            <div
              key={anime.id}
              className="w-[42vw] max-w-[168px] shrink-0 snap-start md:w-auto md:max-w-none"
            >
              <AnimeCard anime={anime} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
