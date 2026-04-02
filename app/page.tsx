import { Metadata } from 'next';
import {
  fetchTrendingByPopularity,
  fetchSeasonNowAnime,
  fetchSeasonUpcomingAnime,
  getAnimeSeasonNow,
  getNextSeason,
} from '@/lib/anilist';
import { JapandiTrendingHeroBlock } from '@/components/JapandiTrendingHeroBlock';
import { JapandiAnimeRowSection } from '@/components/JapandiAnimeRowSection';

export const metadata: Metadata = {
  title: 'PROJECT ANNIE — Anime Discovery',
  description: 'Discover trending anime, now airing, and upcoming seasons. Powered by MyAnimeList via Jikan.',
};

export default async function HomePage() {
  let hero: Awaited<ReturnType<typeof fetchTrendingByPopularity>> = [];
  let nowAiring: Awaited<ReturnType<typeof fetchSeasonNowAnime>> = [];
  let upcoming: Awaited<ReturnType<typeof fetchSeasonUpcomingAnime>> = [];
  const { season: nowSeason, year: nowYear } = getAnimeSeasonNow();
  const nextBlock = getNextSeason(nowSeason, nowYear);

  try {
    [hero, nowAiring, upcoming] = await Promise.all([
      fetchTrendingByPopularity(8),
      fetchSeasonNowAnime(6),
      fetchSeasonUpcomingAnime(6),
    ]);
  } catch {
    // Sections below still render; hero empty state handled inline
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      <JapandiTrendingHeroBlock items={hero} />

      <JapandiAnimeRowSection
        sectionId="now-airing-heading"
        title="Now airing"
        subtitle="Current season on MyAnimeList"
        showAllHref={`/browse?year=${nowYear}&season=${nowSeason}`}
        showAllLabel="Show all"
        items={nowAiring}
        emptyMessage="No listings available for this season yet."
      />

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
            Data provided by{' '}
            <a
              href="https://myanimelist.net"
              target="_blank"
              rel="noopener noreferrer"
              className="text-violet-400 hover:text-violet-300 transition-colors active:scale-95 inline-block"
            >
              MyAnimeList
            </a>
            {' · '}
            <a
              href="https://jikan.moe"
              target="_blank"
              rel="noopener noreferrer"
              className="text-violet-400 hover:text-violet-300 transition-colors active:scale-95 inline-block"
            >
              Jikan API
            </a>
          </p>
        </div>
      </footer>
    </main>
  );
}
