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

const AUTO_ADVANCE_MS = 8000;

/** Multi-layer dark halo so title / body / links stay readable on bright blurred areas. Tune rgba alphas or px offsets here. */
const copyShadowClass =
  '[text-shadow:0_2px_24px_rgba(0,0,0,0.88),0_1px_8px_rgba(0,0,0,0.95),0_0_2px_rgba(0,0,0,1)] md:[text-shadow:0_2px_22px_rgba(0,0,0,0.82),0_1px_6px_rgba(0,0,0,0.92),0_0_1px_rgba(0,0,0,1)]';

const blurPlateClass =
  'object-cover object-center scale-125 blur-[44px] saturate-[0.9] opacity-90';

export interface TrendingHeroCarouselProps {
  items: TrendingHeroAnime[];
}

const heroImageSizes =
  '(max-width: 768px) 100vw, (max-width: 1280px) min(100vw, 1280px), 1280px';

export function TrendingHeroCarousel({ items }: TrendingHeroCarouselProps) {
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
      className="group relative md:aspect-[2.35/1] md:max-h-[min(78vh,860px)] overflow-hidden rounded-[32px] md:rounded-xl border border-white/10 bg-[#0a0a0a]"
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
      {/* Blurred plate: always portrait cover (same source as mobile hero) */}
      <div className="absolute inset-0 z-0 overflow-hidden bg-[#0a0a0a]" aria-hidden>
        {items.map((item, i) => {
          const cover = item.coverImage.extraLarge;
          return (
            <motion.div
              key={`silk-${item.id}`}
              className="absolute inset-0"
              initial={false}
              animate={{ opacity: i === index ? 1 : 0 }}
              transition={fade}
            >
              <Image
                src={cover}
                alt=""
                fill
                sizes={heroImageSizes}
                className={blurPlateClass}
                priority={i === 0}
                quality={75}
              />
              <div className="absolute inset-0 max-md:bg-[#0a0a0a]/50" />
            </motion.div>
          );
        })}
      </div>

      {/* Primary art: portrait cover only (mobile full-bleed; desktop same cover in right frame) */}
      <div className="relative z-[1] h-[min(56vh,520px)] sm:h-[min(60vh,580px)] md:absolute md:inset-0 md:h-full md:min-h-[340px] overflow-hidden rounded-[32px] md:rounded-xl">
        {items.map((item, i) => {
          const cover = item.coverImage.extraLarge;
          return (
            <motion.div
              key={`hero-${item.id}`}
              className="absolute inset-0"
              initial={false}
              animate={{ opacity: i === index ? 1 : 0 }}
              transition={fade}
              aria-hidden={i !== index}
            >
              <Image
                src={cover}
                alt=""
                fill
                sizes={heroImageSizes}
                className="object-cover object-center max-md:block md:hidden"
                priority={i === 0}
                quality={100}
              />
              <div className="pointer-events-none absolute inset-y-0 right-0 z-[2] hidden w-[30%] max-w-xl items-center mr-[50px] justify-center pr-5 pl-2 md:flex lg:pr-8">
                <div className="relative aspect-[2/3] w-full max-h-[min(89%,740px)] overflow-hidden rounded-2xl ring-1 ring-white/15 shadow-2xl shadow-black/40">
                  <Image
                    src={cover}
                    alt=""
                    fill
                    sizes="(max-width: 1280px) 42vw, 400px"
                    className="object-cover object-center"
                    priority={i === 0}
                    quality={100}
                  />
                </div>
              </div>
            </motion.div>
          );
        })}

        <div
          className="pointer-events-none absolute inset-x-0 -bottom-px left-0 right-0 top-[28%] z-[2] bg-gradient-to-t from-black via-black/80 to-transparent m-0 p-0 md:hidden"
          aria-hidden
        />

        {/* Desktop: legibility ramp on text column only (matches prior bottom-left meta block) */}
        <div
          className="pointer-events-none absolute bottom-0 left-0 right-[42%] top-[18%] z-[3] hidden  md:block"
          aria-hidden
        />

        {/* Copy: title, genres, synopsis, CTA — bottom-left on mobile + desktop */}
        <div
          className={`pointer-events-none absolute inset-x-0 bottom-0 z-[5] flex flex-col items-start justify-end text-left px-4 sm:px-6 md:right-[42%] md:px-10 md:pb-10 lg:px-14 lg:pb-12 ${
            n > 1 ? 'pb-14 sm:pb-16 md:pb-20' : 'pb-6 sm:pb-8 md:pb-12'
          }`}
        >
          <div className="relative w-full max-w-3xl min-h-[9.5rem] sm:min-h-[10rem] md:min-h-0 md:max-w-none">
            {items.map((item, i) => {
              const title = item.title.english || item.title.romaji;
              const studio = getPrimaryStudio(item);
              const statusLabel = getStatusLabel(item.status);
              const releaseLabel = getReleaseLabel(item.status);
              const formattedDate = formatDateGMT8(item.startDate);
              const blurb = stripHtml(item.description);
              const preview = blurb.length > 200 ? `${blurb.slice(0, 197)}…` : blurb;
              return (
                <motion.div
                  key={`copy-${item.id}`}
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
                  {preview && (
                    <p
                      className={`text-sm sm:text-base text-gray-200/95 line-clamp-2 md:line-clamp-3 max-w-2xl md:max-w-none ${copyShadowClass}`}
                    >
                      {preview}
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
      </div>

      {items.map((item, i) => {
        const title = item.title.english || item.title.romaji;
        return (
          <Link
            key={`hit-${item.id}`}
            href={`/anime/${item.id}`}
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
                key={`dot-${item.id}`}
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
