import { fetchTrendingByPopularity } from '@/lib/anilist';
import { TrendingCarousel } from '@/components/TrendingHeroCarousel';

/** Streamed so the home shell paints instantly instead of waiting on this fetch. */
export async function HomeTrending() {
  let trending: Awaited<ReturnType<typeof fetchTrendingByPopularity>> = [];
  try {
    trending = await fetchTrendingByPopularity(8);
  } catch {
    return null;
  }
  if (trending.length === 0) return null;
  return <TrendingCarousel items={trending} />;
}
