import { Metadata } from 'next';
import { Suspense } from 'react';
import { WeeklyAiringSchedule } from '@/components/JapandiTrendingHeroBlock';
import { ContinueWatchingRail } from '@/components/ContinueWatchingRail';
import { RecommendationsRail } from '@/components/RecommendationsRail';
import { HomeTrending } from '@/components/HomeTrending';
import { HomeComingNext } from '@/components/HomeComingNext';

export const metadata: Metadata = {
  title: 'PROJECT ANNIE — Anime Discovery',
  description:
    'Discover trending anime, now airing, and upcoming seasons. Powered by AniList.',
};

function TrendingSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-8 pb-8 sm:pb-12">
      <div className="h-[240px] sm:h-[340px] md:h-[400px] w-full rounded-2xl bg-line/[0.04] border border-line/5 animate-pulse" />
    </div>
  );
}

function RowSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-8 pb-12 sm:pb-20">
      <div className="h-8 w-48 rounded-lg bg-line/10 animate-pulse mb-5" />
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="aspect-[2/3] rounded-xl bg-line/5 animate-pulse" />
        ))}
      </div>
    </div>
  );
}

// Synchronous shell → paints instantly; data-dependent sections stream in.
export default function HomePage() {
  return (
    <main className="min-h-screen bg-bg">
      <WeeklyAiringSchedule />

      <ContinueWatchingRail />

      <Suspense fallback={<TrendingSkeleton />}>
        <HomeTrending />
      </Suspense>

      <RecommendationsRail />

      <Suspense fallback={<RowSkeleton />}>
        <HomeComingNext />
      </Suspense>

      <footer className="border-t border-line/10">
        <div className="mx-auto max-w-7xl px-8 py-4 sm:py-6 text-center text-fg-muted text-xs sm:text-sm">
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
