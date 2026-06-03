import { Metadata } from 'next';
import {
  fetchSeasonUpcomingAnime,
  fetchTrendingByPopularity,
  getAnimeSeasonNow,
  getNextSeason,
  type Anime,
} from '@/lib/anilist';
import { WeeklyAiringSchedule } from '@/components/JapandiTrendingHeroBlock';
import { TrendingCarousel } from '@/components/TrendingHeroCarousel';
import { JapandiAnimeRowSection } from '@/components/JapandiAnimeRowSection';
import { ContinueWatchingRail } from '@/components/ContinueWatchingRail';
import { RecommendationsRail } from '@/components/RecommendationsRail';

export const metadata: Metadata = {
  title: 'PROJECT ANNIE — Anime Discovery',
  description:
    'Discover trending anime, now airing, and upcoming seasons. Powered by AniList.',
};

export default async function HomePage() {
  let upcoming: Anime[] = [];
  let trending: Anime[] = [];
  const { season: nowSeason, year: nowYear } = getAnimeSeasonNow();
  const nextBlock = getNextSeason(nowSeason, nowYear);

  try {
    [upcoming, trending] = await Promise.all([
      fetchSeasonUpcomingAnime(6),
      fetchTrendingByPopularity(8),
    ]);
  } catch {
    // Sections below still render
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      <WeeklyAiringSchedule />

      <ContinueWatchingRail />

      {trending.length > 0 && (
        <TrendingCarousel items={trending} />
      )}

      <RecommendationsRail />

      <JapandiAnimeRowSection
        sectionId="coming-next-heading"
        title="Coming next"
        subtitle="Upcoming season lineup"
        showAllHref={`/browse?year=${nextBlock.year}&season=${nextBlock.season}`}
        showAllLabel="Show all"
        items={upcoming}
        emptyMessage="No listings available for this season yet."
        bottomSpacingClassName="pb-12 sm:pb-20"
      />

      <footer className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-8 py-4 sm:py-6 text-center text-gray-500 text-xs sm:text-sm">
          <p>
            Data from{' '}
            <a
              href="https://anilist.co"
              target="_blank"
              rel="noopener noreferrer"
              className="text-violet-400 hover:text-violet-300 transition-colors active:scale-95 inline-block"
            >
              AniList
            </a>
            .
          </p>
        </div>
      </footer>
    </main>
  );
}
