import {
  fetchSeasonUpcomingAnime,
  getAnimeSeasonNow,
  getNextSeason,
} from '@/lib/anilist';
import { JapandiAnimeRowSection } from '@/components/JapandiAnimeRowSection';

/** Streamed "Coming next" row so it doesn't block the home shell. */
export async function HomeComingNext() {
  const { season, year } = getAnimeSeasonNow();
  const next = getNextSeason(season, year);

  let upcoming: Awaited<ReturnType<typeof fetchSeasonUpcomingAnime>> = [];
  try {
    upcoming = await fetchSeasonUpcomingAnime(6);
  } catch {
    return null;
  }

  return (
    <JapandiAnimeRowSection
      sectionId="coming-next-heading"
      title="Coming next"
      subtitle="Upcoming season lineup"
      showAllHref={`/browse?year=${next.year}&season=${next.season}`}
      showAllLabel="Show all"
      items={upcoming}
      emptyMessage="No listings available for this season yet."
      bottomSpacingClassName="pb-12 sm:pb-20"
    />
  );
}
