import { Metadata } from 'next';
import {
  fetchSeasonTrendingHero,
  getAnimeSeasonNow,
  fetchSeasonAnimeLimited,
} from '@/lib/anilist';
import { JapandiTrendingHeroBlock } from '@/components/JapandiTrendingHeroBlock';
import { JapandiAnimeRowSection } from '@/components/JapandiAnimeRowSection';

export const metadata: Metadata = {
  title: 'PROJECT ANNIE — Anime Discovery',
  description: 'Discover trending anime, now airing, and upcoming seasons. Powered by AniList.',
};

export default async function HomePage() {
  let hero: Awaited<ReturnType<typeof fetchSeasonTrendingHero>> = [];
  let spring: Awaited<ReturnType<typeof fetchSeasonAnimeLimited>> = [];
  let summer: Awaited<ReturnType<typeof fetchSeasonAnimeLimited>> = [];
  const { season: heroSeason, year: heroYear } = getAnimeSeasonNow();

  try {
    [hero, spring, summer] = await Promise.all([
      fetchSeasonTrendingHero(heroSeason, heroYear, 6),
      fetchSeasonAnimeLimited('SPRING', 2026, {
        limit: 6,
        preferStatus: ['RELEASING'],
      }),
      fetchSeasonAnimeLimited('SUMMER', 2026, {
        limit: 6,
        preferStatus: ['NOT_YET_RELEASED', 'RELEASING'],
      }),
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
        subtitle="Spring 2026 — currently releasing"
        showAllHref="/browse?year=2026&season=SPRING"
        showAllLabel="Show all"
        items={spring}
        emptyMessage="No listings available for this season yet."
      />

      <JapandiAnimeRowSection
        sectionId="coming-next-heading"
        title="Coming next"
        subtitle="Summer 2026 — arriving soon"
        showAllHref="/browse?year=2026&season=SUMMER"
        showAllLabel="Show all"
        items={summer}
        emptyMessage="No listings available for this season yet."
        bottomSpacingClassName="pb-12 sm:pb-20"
      />

      <footer className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 md:px-8 py-4 sm:py-6 text-center text-gray-500 text-xs sm:text-sm">
          <p>
            Data provided by{' '}
            <a
              href="https://anilist.co"
              target="_blank"
              rel="noopener noreferrer"
              className="text-violet-400 hover:text-violet-300 transition-colors active:scale-95 inline-block"
            >
              AniList
            </a>
          </p>
        </div>
      </footer>
    </main>
  );
}
