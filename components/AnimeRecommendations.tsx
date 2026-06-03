import { fetchRecommendationsForIds } from '@/lib/anilist';
import { AnimeCard } from '@/components/AnimeCard';

/**
 * Streamed "Recommended" section for a single title's detail page.
 * Uses AniList's own recommendations — no score shown, pure "if you liked this".
 */
export async function AnimeRecommendations({ animeId }: { animeId: number }) {
  let recs: Awaited<ReturnType<typeof fetchRecommendationsForIds>> = [];
  try {
    recs = await fetchRecommendationsForIds([animeId], 10);
  } catch {
    return null;
  }

  if (recs.length === 0) return null;

  return (
    <div>
      <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">Recommended</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
        {recs.map((anime) => (
          <AnimeCard key={anime.id} anime={anime} />
        ))}
      </div>
    </div>
  );
}
