import dynamic from 'next/dynamic';
import Link from 'next/link';
import type { TrendingHeroAnime } from '@/lib/anilist';

const JapandiTrendingHeroCarousel = dynamic(
  () =>
    import('@/components/TrendingHeroCarousel').then((mod) => ({
      default: mod.TrendingHeroCarousel,
    })),
  {
    loading: () => (
      <div
        className="rounded-[32px] md:rounded-xl border border-white/10 bg-white/[0.03] animate-pulse h-[min(56vh,520px)] sm:h-[min(60vh,580px)] md:aspect-[2.35/1] md:max-h-[min(78vh,860px)] md:h-auto"
        aria-hidden
      />
    ),
    ssr: true,
  }
);

export interface JapandiTrendingHeroBlockProps {
  items: TrendingHeroAnime[];
}

export function JapandiTrendingHeroBlock({ items }: JapandiTrendingHeroBlockProps) {
  return (
    <section className="mx-auto max-w-7xl px-4 md:px-8 pt-2 pb-8 sm:pb-12" aria-label="Featured trending">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl md:text-4xl font-bold text-white tracking-tight">Trending now</h1>
        <p className="text-gray-400 text-sm sm:text-base mt-1">Top picks from AniList this season</p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-16 text-center text-gray-400">
          Could not load trending titles. Try{' '}
          <Link href="/browse" className="text-violet-400 hover:text-violet-300 underline">
            Browse
          </Link>
          .
        </div>
      ) : (
        <JapandiTrendingHeroCarousel items={items} />
      )}
    </section>
  );
}
