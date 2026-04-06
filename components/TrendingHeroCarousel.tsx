'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  stripHtml,
  type TrendingHeroAnime,
  getPrimaryStudio,
  getStatusLabel,
  getReleaseLabel,
  formatDateGMT8,
} from '@/lib/anilist';
import { displayTitleForLanguage, useTitleLanguage } from '@/context/TitleLanguageContext';

const AUTO_ADVANCE_MS = 8000;

const copyShadowClass =
  '[text-shadow:0_2px_24px_rgba(0,0,0,0.88),0_1px_8px_rgba(0,0,0,0.95),0_0_2px_rgba(0,0,0,1)] md:[text-shadow:0_2px_22px_rgba(0,0,0,0.82),0_1px_6px_rgba(0,0,0,0.92),0_0_1px_rgba(0,0,0,1)]';

export interface TrendingHeroCarouselProps {
  items: TrendingHeroAnime[];
}

const heroImageSizes =
  '(max-width: 768px) 100vw, (max-width: 1280px) min(100vw, 1280px), 1280px';

const heroDesktopMaxBox =
  'md:max-w-[min(100%,calc((min(78vh,860px))*(16/9)))] md:mx-auto';

/** Banner when present; otherwise cover (double-layer fallback uses the same URL for blur + sharp). */
function heroVisualUrl(item: TrendingHeroAnime): string {
  const b = item.bannerImage?.trim();
  if (b) return b;
  return item.coverImage.extraLarge;
}

function imageUnoptimized(src: string): boolean {
  try {
    const h = new URL(src).hostname;
    if (h === 'cdn.myanimelist.net') return false;
    if (h === 'myanimelist.net' || h.endsWith('.myanimelist.net')) return false;
    return true;
  } catch {
    return true;
  }
}

export function TrendingHeroCarousel({ items }: TrendingHeroCarouselProps) {
  const { titleLanguage } = useTitleLanguage();
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const n = items.length;

  const go = useCallback(
    (delta: number) => {
      if (n === 0) return;
      setIndex((i) => (i + delta + n) % n);
    },
    [n]
  );

  useEffect(() => {
    if (n <= 1 || reduceMotion) return;
    const id = window.setInterval(() => go(1), AUTO_ADVANCE_MS);
    return () => clearInterval(id);
  }, [n, go, reduceMotion]);

  const fade = reduceMotion
    ? { duration: 0.2, ease: 'easeOut' as const }
    : { duration: 1.28, ease: [0.22, 0.61, 0.36, 1] as const };

  if (n === 0) return null;

  return (
    <div
      className={`group relative w-full md:aspect-[16/9] md:min-h-[min(28rem,52vw)] md:max-h-[min(78vh,860px)] ${heroDesktopMaxBox} overflow-hidden rounded-[32px] md:rounded-xl border border-white/10 bg-[#0a0a0a]`}
      role="region"
      aria-roledescription="carousel"
      aria-label="Trending anime highlights"
      onTouchStart={(e) => {
        touchStartX.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        if (touchStartX.current == null) return;
        const dx = e.changedTouches[0].clientX - touchStartX.current;
        touchStartX.current = null;
        if (dx > 56) go(-1);
        else if (dx < -56) go(1);
      }}
    >
      {/* Background: same art, cinematic blur (global — no banner asset from API) */}
      <div className="absolute inset-0 z-0 overflow-hidden bg-[#0a0a0a]" aria-hidden>
        {items.map((item, i) => {
          const src = heroVisualUrl(item);
          return (
            <motion.div
              key={`bg-${item.mal_id}`}
              className="absolute inset-0"
              initial={false}
              animate={{ opacity: i === index ? 1 : 0 }}
              transition={fade}
            >
              <Image
                src={src}
                alt=""
                fill
                sizes={heroImageSizes}
                className="object-cover object-center blur-3xl opacity-40"
                priority={i === 0}
                quality={75}
                unoptimized={imageUnoptimized(src)}
              />
            </motion.div>
          );
        })}
      </div>

      {/* Foreground: sharp contain (mobile + desktop “Image 1” column) */}
      <div className="relative z-[1] h-[min(56vh,520px)] sm:h-[min(60vh,580px)] md:absolute md:inset-0 md:h-full md:min-h-[min(28rem,52vw)] overflow-hidden rounded-[32px] md:rounded-xl">
        {items.map((item, i) => {
          const src = heroVisualUrl(item);
          return (
            <motion.div
              key={`fg-${item.mal_id}`}
              className="absolute inset-0"
              initial={false}
              animate={{ opacity: i === index ? 1 : 0 }}
              transition={fade}
              aria-hidden={i !== index}
            >
              <Image
                src={src}
                alt=""
                fill
                sizes={heroImageSizes}
                className="object-contain object-center max-md:object-[center_20%] md:hidden"
                priority={i === 0}
                quality={100}
                unoptimized={imageUnoptimized(src)}
              />
            </motion.div>
          );
        })}

        {/* Bottom read gradient for copy (global) */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 top-1/4 z-[2] bg-gradient-to-t from-black via-black/70 to-transparent md:top-[20%]"
          aria-hidden
        />

        <div
          className={`pointer-events-none absolute inset-0 z-[3] flex min-h-0 max-md:flex-col max-md:justify-end px-8 text-left md:grid md:grid-cols-[minmax(0,1fr)_minmax(15rem,min(38%,36rem))] md:grid-rows-1 md:items-stretch md:gap-6 md:px-8 md:pb-10 md:pt-10 ${
            n > 1 ? 'pb-14 sm:pb-16 md:pb-16' : 'pb-6 sm:pb-8 md:pb-10'
          }`}
        >
          <div className="pointer-events-none mt-auto flex min-h-0 w-full min-w-0 flex-col md:mt-0 md:h-full md:min-h-0">
            <div className="relative min-h-[9.5rem] w-full max-w-3xl sm:min-h-[10rem] md:h-full md:min-h-0 md:max-w-none">
              {items.map((item, i) => {
                const title = displayTitleForLanguage(item.title, titleLanguage);
                const studio = getPrimaryStudio(item);
                const statusLabel = getStatusLabel(item.status);
                const releaseLabel = getReleaseLabel(item.status);
                const formattedDate = formatDateGMT8(item.startDate);
                const blurb = stripHtml(item.description);
                return (
                  <motion.div
                    key={`copy-${item.mal_id}`}
                    className="absolute bottom-0 left-0 right-0 flex flex-col items-stretch justify-end space-y-2 md:space-y-3 min-w-0"
                    initial={false}
                    animate={{ opacity: i === index ? 1 : 0 }}
                    transition={fade}
                    aria-hidden={i !== index}
                  >
                    <h2
                      className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-tight break-words ${copyShadowClass}`}
                    >
                      {title}
                    </h2>
                    <p
                      className={`text-xs sm:text-sm font-medium text-white/90 break-words ${copyShadowClass}`}
                    >
                      {studio} - {statusLabel}
                      {item.episodes != null && item.episodes > 0 ? (
                        <>
                          {' '}
                          <span className="text-white/55">·</span>
                          {` ${item.episodes} ${item.episodes === 1 ? 'ep' : 'eps'}`}
                        </>
                      ) : null}
                    </p>
                    <p className={`text-xs sm:text-sm text-white/90 break-words ${copyShadowClass}`}>
                      {releaseLabel}{' '}
                      <span className="font-semibold text-white">{formattedDate}</span>
                    </p>
                    {item.genres?.length > 0 && (
                      <div className="flex flex-wrap gap-1 sm:gap-1.5">
                        {item.genres.slice(0, 4).map((genre) => (
                          <span
                            key={genre}
                            className="max-w-full truncate px-1.5 py-0.5 sm:px-2 sm:py-1 text-[10px] sm:text-xs font-medium bg-violet-600/90 text-white rounded-md shadow-md"
                            title={genre}
                          >
                            {genre}
                          </span>
                        ))}
                      </div>
                    )}
                    {blurb && (
                      <p
                        className={`text-sm sm:text-base text-gray-200/95 line-clamp-3 md:line-clamp-4 max-w-2xl lg:max-w-none ${copyShadowClass}`}
                      >
                        {blurb}
                      </p>
                    )}
                    <span
                      className={`inline-flex min-h-11 items-center text-sm font-semibold text-violet-400 pt-0.5 ${copyShadowClass}`}
                    >
                      View details →
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </div>

          <div className="relative mt-auto hidden min-h-0 w-full md:mt-0 md:block md:h-full">
            {items.map((item, i) => {
              const src = heroVisualUrl(item);
              return (
                <motion.div
                  key={`poster-${item.mal_id}`}
                  className="pointer-events-none absolute inset-0 flex items-end justify-center pb-2"
                  initial={false}
                  animate={{ opacity: i === index ? 1 : 0 }}
                  transition={fade}
                  aria-hidden={i !== index}
                >
                  <div className="relative aspect-[2/3] w-full max-h-[min(740px,100%)] max-w-full overflow-hidden rounded-2xl ring-1 ring-white/15 shadow-2xl shadow-black/40 bg-black/20">
                    <Image
                      src={src}
                      alt=""
                      fill
                      sizes="(max-width: 768px) 0px, 38vw, 480px"
                      className="object-contain object-center"
                      priority={i === 0}
                      quality={100}
                      unoptimized={imageUnoptimized(src)}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {items.map((item, i) => {
        const title = displayTitleForLanguage(item.title, titleLanguage);
        return (
          <Link
            key={`hit-${item.mal_id}`}
            href={`/anime/${item.mal_id}`}
            className={`absolute inset-0 z-[4] outline-none transition-opacity focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-inset ${
              i === index ? 'pointer-events-auto' : 'pointer-events-none'
            }`}
            aria-hidden={i !== index}
            tabIndex={i === index ? 0 : -1}
            aria-label={`View ${title}`}
          />
        );
      })}

      {n > 1 && (
        <>
          <div className="absolute inset-y-0 left-0 right-0 z-[6] flex items-center justify-between px-1 sm:px-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                go(-1);
              }}
              className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full bg-black/35 text-white/90 backdrop-blur-sm border border-white/10 hover:bg-black/50 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 min-h-11 min-w-11"
              aria-label="Previous slide"
            >
              <ChevronLeft className="h-5 w-5" strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                go(1);
              }}
              className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full bg-black/35 text-white/90 backdrop-blur-sm border border-white/10 hover:bg-black/50 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 min-h-11 min-w-11"
              aria-label="Next slide"
            >
              <ChevronRight className="h-5 w-5" strokeWidth={2} />
            </button>
          </div>

          <div
            className="absolute bottom-3 left-0 right-0 z-[6] flex justify-center gap-1.5 pointer-events-auto"
            role="tablist"
            aria-label="Slide indicators"
          >
            {items.map((item, i) => (
              <button
                key={`dot-${item.mal_id}`}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`Show slide ${i + 1}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIndex(i);
                }}
                className={`h-1.5 rounded-full transition-all duration-300 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a] ${
                  i === index ? 'w-6 bg-violet-500' : 'w-1.5 bg-white/20 hover:bg-white/35'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
