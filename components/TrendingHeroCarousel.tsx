'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { type Anime, getPrimaryStudio, getStatusLabel } from '@/lib/anilist';
import { displayTitleForLanguage, useTitleLanguage } from '@/context/TitleLanguageContext';
import { useTrackingStatus, TRACKING_BADGE } from '@/context/TrackingContext';
import {
  JapandiShowAllLink,
  JapandiSectionShowAllMobile,
} from '@/components/JapandiAnimeRowSection';

const AUTO_ADVANCE_MS = 7000;

const copyShadow =
  '[text-shadow:0_1px_12px_rgba(0,0,0,0.95),0_0_2px_rgba(0,0,0,1)]';

function cardImageUrl(item: Anime): string {
  const b = item.bannerImage?.trim();
  if (b) return b;
  return item.coverImage.extraLarge;
}

/* ------------------------------------------------------------------ */
/*  Single landscape card                                              */
/* ------------------------------------------------------------------ */

function TrendingCard({
  anime,
  rank,
  index,
}: {
  anime: Anime;
  rank: number;
  index: number;
}) {
  const { titleLanguage } = useTitleLanguage();
  const title = displayTitleForLanguage(anime.title, titleLanguage);
  const studio = getPrimaryStudio(anime);
  const statusLabel = getStatusLabel(anime.status);
  const src = cardImageUrl(anime);
  const trackingStatus = useTrackingStatus(anime.id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.45,
        delay: index * 0.04,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="w-[85vw] max-w-[22rem] md:w-[calc((100%-2rem)/2.5)] md:max-w-none shrink-0 snap-start"
    >
      <Link
        href={`/anime/${anime.id}`}
        className="group relative flex flex-col overflow-hidden rounded-2xl bg-transparent shadow-lg transition-all duration-300 md:hover:scale-[1.02] md:hover:shadow-2xl active:scale-[0.97] md:active:scale-100 cursor-pointer"
        aria-label={`View ${title}`}
      >
        {/* Image container — 3:2 mobile, 16:9 desktop */}
        <div className="relative w-full aspect-[3/2] md:aspect-video overflow-hidden rounded-2xl">
          <Image
            src={src}
            alt={title}
            fill
            sizes="(max-width:768px) 85vw, 40vw"
            className={`object-cover object-center transition-transform duration-500 group-hover:scale-105 ${
              !anime.bannerImage?.trim() ? 'object-[center_20%]' : ''
            }`}
          />

          {/* Rank number — large typographic watermark */}
          <span
            className="absolute top-3 left-3.5 z-[3] text-5xl md:text-6xl font-black leading-none text-black/80 select-none pointer-events-none [-webkit-text-stroke:1px_rgba(255,255,255,0.3)] [text-shadow:0_0_20px_rgba(255,255,255,0.2),0_0_4px_rgba(255,255,255,0.15)]"
            aria-hidden
          >
            #{rank}
          </span>

          {/* Genre pills — top right (show 2 on mobile, 3rd revealed on md+) */}
          {anime.genres?.length > 0 && (
            <div className="absolute top-3 right-3 z-[3] flex gap-1.5">
              {anime.genres.slice(0, 3).map((g, gi) => (
                <span
                  key={g}
                  className={`max-w-[6rem] truncate px-2 py-0.5 text-[10px] md:text-xs font-medium bg-violet-600/90 text-white rounded-md shadow-md backdrop-blur-sm ${
                    gi >= 2 ? 'hidden md:inline' : ''
                  }`}
                >
                  {g}
                </span>
              ))}
            </div>
          )}

          {/* Bottom gradient + copy */}
          <div className="absolute inset-x-0 bottom-0 z-[2] rounded-b-2xl bg-gradient-to-t from-black/90 via-black/60 to-transparent pt-16 px-4 pb-10 md:px-5 md:pb-4">
            {trackingStatus && (() => {
              const badge = TRACKING_BADGE[trackingStatus];
              const BadgeIcon = badge.icon;
              return (
                <div className={`inline-flex items-center gap-1 px-2 py-0.5 mb-2 rounded-md backdrop-blur-md border text-[10px] md:text-xs font-semibold text-white ${badge.bg} ${badge.border}`}>
                  <BadgeIcon className="w-3 h-3" strokeWidth={2.5} />
                  {badge.label}
                </div>
              );
            })()}
            <h3
              className={`text-base md:text-lg font-bold text-white line-clamp-2 leading-snug ${copyShadow}`}
            >
              {title}
            </h3>
            <p
              className={`mt-1 text-xs md:text-sm text-white/80 line-clamp-1 ${copyShadow}`}
            >
              {studio}
              {anime.episodes != null && anime.episodes > 0 && (
                <>
                  {' '}
                  <span className="text-white/40">·</span>
                  {` ${anime.episodes} eps`}
                </>
              )}
              {' '}
              <span className="text-white/40">·</span>
              {` ${statusLabel}`}
            </p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main export                                                        */
/* ------------------------------------------------------------------ */

export interface TrendingCarouselProps {
  items: Anime[];
}

export function TrendingCarousel({ items }: TrendingCarouselProps) {
  const reduceMotion = useReducedMotion();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const pausedRef = useRef(false);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener('scroll', updateScrollState, { passive: true });
    const ro = new ResizeObserver(updateScrollState);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      ro.disconnect();
    };
  }, [updateScrollState]);

  const scrollBy = useCallback((direction: 1 | -1) => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = el.querySelector<HTMLElement>(':scope > div')?.offsetWidth ?? 320;
    const gap = 16;
    el.scrollBy({ left: direction * (cardWidth + gap), behavior: 'smooth' });
  }, []);

  // Auto-advance
  useEffect(() => {
    if (items.length <= 1 || reduceMotion) return;
    const id = setInterval(() => {
      if (pausedRef.current) return;
      const el = scrollRef.current;
      if (!el) return;
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
      if (atEnd) {
        el.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        const cardWidth = el.querySelector<HTMLElement>(':scope > div')?.offsetWidth ?? 320;
        el.scrollBy({ left: cardWidth + 16, behavior: 'smooth' });
      }
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(id);
  }, [items.length, reduceMotion]);

  if (items.length === 0) return null;

  return (
    <section
      className="mx-auto max-w-7xl px-8 pb-10 sm:pb-14"
      role="region"
      aria-roledescription="carousel"
      aria-label="Trending anime"
    >
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-4 md:mb-6">
        <div>
          <h2 className="text-2xl md:text-4xl font-bold text-white tracking-tight">
            Trending now
          </h2>
          <p className="text-gray-400 text-sm sm:text-base mt-1">
            Most popular across all seasons
          </p>
        </div>
        <div className="hidden md:flex shrink-0">
          <JapandiShowAllLink href="/browse" label="Show all" variant="header" />
        </div>
      </div>

      {/* Carousel track */}
      <div
        className="group/carousel relative"
        onMouseEnter={() => { pausedRef.current = true; }}
        onMouseLeave={() => { pausedRef.current = false; }}
        onTouchStart={() => { pausedRef.current = true; }}
        onTouchEnd={() => {
          setTimeout(() => { pausedRef.current = false; }, 4000);
        }}
      >
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-smooth pb-2"
        >
          {items.map((anime, i) => (
            <TrendingCard
              key={anime.id}
              anime={anime}
              rank={i + 1}
              index={i}
            />
          ))}
        </div>

        {/* Chevron — Left */}
        <button
          type="button"
          onClick={() => scrollBy(-1)}
          className={`absolute left-2 top-1/2 -translate-y-1/2 z-10 hidden md:flex h-10 w-10 min-h-11 min-w-11 items-center justify-center rounded-full bg-black/40 text-white/90 backdrop-blur-sm border border-white/10 hover:bg-black/60 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 transition-opacity duration-300 ${
            canScrollLeft ? 'md:opacity-0 md:group-hover/carousel:opacity-100' : 'md:opacity-0 pointer-events-none'
          }`}
          aria-label="Scroll left"
        >
          <ChevronLeft className="h-5 w-5" strokeWidth={2} />
        </button>

        {/* Chevron — Right */}
        <button
          type="button"
          onClick={() => scrollBy(1)}
          className={`absolute right-2 top-1/2 -translate-y-1/2 z-10 hidden md:flex h-10 w-10 min-h-11 min-w-11 items-center justify-center rounded-full bg-black/40 text-white/90 backdrop-blur-sm border border-white/10 hover:bg-black/60 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 transition-opacity duration-300 ${
            canScrollRight ? 'md:opacity-0 md:group-hover/carousel:opacity-100' : 'md:opacity-0 pointer-events-none'
          }`}
          aria-label="Scroll right"
        >
          <ChevronRight className="h-5 w-5" strokeWidth={2} />
        </button>
      </div>

      {/* Mobile "Show all" */}
      <JapandiSectionShowAllMobile showAllHref="/browse" showAllLabel="Show all" />
    </section>
  );
}
