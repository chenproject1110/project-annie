'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock } from 'lucide-react';
import { displayTitleForLanguage, useTitleLanguage } from '@/context/TitleLanguageContext';
import type { AnimeTitle } from '@/lib/anilist';

const JIKAN_API = 'https://api.jikan.moe/v4';

const DAYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;
type DayKey = (typeof DAYS)[number];

const DAY_LABELS: Record<DayKey, string> = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun',
};

/* ------------------------------------------------------------------ */
/*  JST helpers                                                        */
/* ------------------------------------------------------------------ */

function getCurrentJSTDay(): DayKey {
  const name = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Tokyo',
    weekday: 'long',
  })
    .format(new Date())
    .toLowerCase();
  return (DAYS as readonly string[]).includes(name)
    ? (name as DayKey)
    : 'monday';
}

function getJSTHourMinute(): [number, number] {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Tokyo',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date());
  return [
    parseInt(parts.find((p) => p.type === 'hour')?.value ?? '0', 10),
    parseInt(parts.find((p) => p.type === 'minute')?.value ?? '0', 10),
  ];
}

function checkAiringNow(
  broadcastTime: string | null,
  selectedDay: DayKey,
): boolean {
  if (!broadcastTime) return false;
  if (getCurrentJSTDay() !== selectedDay) return false;
  const [h, m] = getJSTHourMinute();
  const [bh, bm] = broadcastTime.split(':').map(Number);
  const now = h * 60 + m;
  const air = bh * 60 + bm;
  return now >= air && now - air <= 30;
}

/* ------------------------------------------------------------------ */
/*  Jikan schedule types & fetcher                                     */
/* ------------------------------------------------------------------ */

interface JikanScheduleItem {
  mal_id: number;
  title: string;
  title_english?: string | null;
  title_japanese?: string | null;
  images?: {
    webp?: { large_image_url?: string | null };
    jpg?: {
      large_image_url?: string | null;
      image_url?: string | null;
    };
  };
  broadcast?: { time?: string | null };
  episodes?: number | null;
  genres?: Array<{ name: string }>;
  explicit_genres?: Array<{ name: string }>;
  themes?: Array<{ name: string }>;
  demographics?: Array<{ name: string }>;
  studios?: Array<{ name: string }>;
}

interface ScheduleAnime {
  mal_id: number;
  title: AnimeTitle;
  coverImage: string;
  broadcastTime: string | null;
  episodes: number | null;
  genres: string[];
  studio: string;
}

function isAdult(item: JikanScheduleItem): boolean {
  const all = [
    ...(item.genres ?? []),
    ...(item.explicit_genres ?? []),
    ...(item.themes ?? []),
    ...(item.demographics ?? []),
  ];
  return all.some((g) => {
    const n = g.name.toLowerCase();
    return n === 'hentai' || n === 'erotica';
  });
}

function toScheduleAnime(item: JikanScheduleItem): ScheduleAnime {
  return {
    mal_id: item.mal_id,
    title: {
      english: item.title_english?.trim() || null,
      romaji: item.title || 'Untitled',
      native: item.title_japanese || null,
    },
    coverImage:
      item.images?.webp?.large_image_url ||
      item.images?.jpg?.large_image_url ||
      item.images?.jpg?.image_url ||
      '',
    broadcastTime: item.broadcast?.time?.trim() || null,
    episodes: item.episodes ?? null,
    genres: (item.genres ?? []).map((g) => g.name),
    studio: item.studios?.[0]?.name || '',
  };
}

async function fetchSchedule(day: string): Promise<ScheduleAnime[]> {
  const res = await fetch(
    `${JIKAN_API}/schedules?filter=${day}&limit=25&sfw=true`,
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  const data: JikanScheduleItem[] = Array.isArray(json?.data) ? json.data : [];

  const items = data.filter((i) => !isAdult(i)).map(toScheduleAnime);

  const seen = new Set<number>();
  const unique = items.filter((a) => {
    if (seen.has(a.mal_id)) return false;
    seen.add(a.mal_id);
    return true;
  });

  unique.sort((a, b) => {
    if (!a.broadcastTime && !b.broadcastTime) return 0;
    if (!a.broadcastTime) return 1;
    if (!b.broadcastTime) return -1;
    return a.broadcastTime.localeCompare(b.broadcastTime);
  });

  return unique;
}

/* ------------------------------------------------------------------ */
/*  Schedule card                                                      */
/* ------------------------------------------------------------------ */

const hoverShadow =
  '[text-shadow:0_1px_12px_rgba(0,0,0,0.95),0_0_2px_rgba(0,0,0,1)]';

function ScheduleCard({
  anime,
  index,
  isLive,
}: {
  anime: ScheduleAnime;
  index: number;
  isLive: boolean;
}) {
  const { titleLanguage } = useTitleLanguage();
  const title = displayTitleForLanguage(anime.title, titleLanguage);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.45,
        delay: index * 0.04,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      <Link
        href={`/anime/${anime.mal_id}`}
        className={`group relative flex flex-col rounded-[32px] md:rounded-xl overflow-hidden bg-gray-800 shadow-lg transition-all duration-300 md:hover:scale-105 active:scale-95 md:active:scale-100 cursor-pointer ${
          isLive
            ? 'ring-2 ring-violet-500/60 shadow-[0_0_24px_rgba(139,92,246,0.25)]'
            : 'hover:shadow-2xl'
        }`}
      >
        <div className="relative w-full aspect-[2/3] overflow-hidden">
          {anime.coverImage && (
            <Image
              src={anime.coverImage}
              alt={title}
              fill
              sizes="(max-width:640px) 50vw,(max-width:768px) 33vw,(max-width:1024px) 25vw,20vw"
              className="object-cover"
            />
          )}

          {/* Time badge */}
          {anime.broadcastTime && (
            <div
              className={`absolute top-2 right-2 z-[3] flex items-center gap-1 px-2 py-1 rounded-lg backdrop-blur-md border text-xs font-semibold ${
                isLive
                  ? 'bg-violet-500/25 border-violet-400/40 text-violet-200'
                  : 'bg-white/10 border-white/10 text-white/90'
              }`}
            >
              <Clock className="w-3 h-3" strokeWidth={2.5} />
              {anime.broadcastTime}
            </div>
          )}

          {/* Live pulse */}
          {isLive && (
            <div className="absolute top-2 left-2 z-[3] flex items-center gap-1.5 px-2 py-1 rounded-lg bg-violet-500/25 backdrop-blur-md border border-violet-400/40">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-violet-300" />
              </span>
              <span className="text-[10px] font-bold text-violet-200 uppercase tracking-wider">
                Live
              </span>
            </div>
          )}

          {/* Desktop hover overlay */}
          <div className="hidden md:flex absolute inset-0 z-[2] flex-col opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            <div
              className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/65 to-black/90"
              aria-hidden
            />
            <div className="relative flex h-full min-h-0 min-w-0 flex-col justify-end gap-2 lg:gap-3 p-3 lg:p-5">
              <h3
                className={`text-base lg:text-xl font-bold text-white line-clamp-3 leading-tight break-words ${hoverShadow}`}
              >
                {title}
              </h3>
              <p
                className={`text-[11px] lg:text-xs font-medium text-white/90 break-words ${hoverShadow}`}
              >
                {anime.studio || 'Unknown Studio'}
                {anime.episodes != null && anime.episodes > 0 && (
                  <>
                    {' '}
                    <span className="text-white/55">·</span>
                    {` ${anime.episodes} eps`}
                  </>
                )}
              </p>
              {anime.broadcastTime && (
                <p
                  className={`text-[11px] lg:text-xs text-white/70 ${hoverShadow}`}
                >
                  Airs at {anime.broadcastTime} JST
                </p>
              )}
              {anime.genres.length > 0 && (
                <div className="flex min-w-0 shrink-0 flex-wrap gap-1 lg:gap-1.5">
                  {anime.genres.slice(0, 3).map((g) => (
                    <span
                      key={g}
                      className="max-w-full truncate px-1.5 py-0.5 lg:px-2 lg:py-1 text-[10px] lg:text-xs font-medium bg-violet-600/90 text-white rounded-md shadow-md"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Mobile bottom bar */}
          <div className="md:hidden absolute inset-x-0 bottom-0 z-[1] bg-gradient-to-t from-black via-black/80 to-transparent px-2.5 sm:px-3 pt-12 pb-1.5 sm:pb-2">
            <h3 className="text-xs sm:text-sm font-semibold text-white line-clamp-2 leading-snug">
              {title}
            </h3>
            <p className="text-[10px] sm:text-xs text-gray-300 line-clamp-1 mt-0.5">
              {anime.studio}
              {anime.episodes ? ` · ${anime.episodes} eps` : ''}
            </p>
          </div>

          {/* Desktop resting bar */}
          <div className="hidden md:block absolute inset-x-0 bottom-0 z-[1] bg-gradient-to-t from-black via-black/80 to-transparent px-3 pt-12 pb-2.5 group-hover:opacity-0 transition-opacity duration-300">
            <h3 className="text-sm font-semibold text-white line-clamp-2">
              {title}
            </h3>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main export                                                        */
/* ------------------------------------------------------------------ */

export function WeeklyAiringSchedule() {
  const [selectedDay, setSelectedDay] = useState<DayKey>('monday');
  const [schedule, setSchedule] = useState<ScheduleAnime[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [tick, setTick] = useState(0);
  const cache = useRef<Partial<Record<DayKey, ScheduleAnime[]>>>({});
  const selectorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectedDay(getCurrentJSTDay());
  }, []);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const cached = cache.current[selectedDay];
    if (cached) {
      setSchedule(cached);
      setLoading(false);
      setError(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(false);

    fetchSchedule(selectedDay)
      .then((data) => {
        if (cancelled) return;
        cache.current[selectedDay] = data;
        setSchedule(data);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedDay]);

  const scrollActiveIntoView = useCallback((day: DayKey) => {
    if (!selectorRef.current) return;
    const btn = selectorRef.current.querySelector(
      `[data-day="${day}"]`,
    ) as HTMLElement | null;
    btn?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center',
    });
  }, []);

  useEffect(() => {
    scrollActiveIntoView(selectedDay);
  }, [selectedDay, scrollActiveIntoView]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const jstDay = useMemo(() => getCurrentJSTDay(), [tick]);

  return (
    <section
      className="mx-auto max-w-7xl px-8 pt-2 pb-8 sm:pb-12"
      aria-label="Weekly airing schedule"
    >
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl md:text-4xl font-bold text-white tracking-tight">
          Weekly airing schedule
        </h1>
        <p className="text-gray-400 text-sm sm:text-base mt-1">
          Broadcast times in JST
        </p>
      </div>

      {/* Day selector */}
      <div
        ref={selectorRef}
        className="relative mb-6 sm:mb-8 flex gap-0.5 overflow-x-auto scrollbar-hide rounded-full bg-white/[0.04] border border-white/10 p-1 backdrop-blur-lg"
        role="tablist"
        aria-label="Day of week"
      >
        {DAYS.map((day) => {
          const active = day === selectedDay;
          const isToday = day === jstDay;
          return (
            <button
              key={day}
              data-day={day}
              role="tab"
              aria-selected={active}
              onClick={() => setSelectedDay(day)}
              className={`relative z-[1] flex-1 min-w-[3rem] sm:min-w-[3.5rem] px-2 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm font-medium rounded-full transition-colors duration-200 whitespace-nowrap ${
                active ? 'text-white' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {active && (
                <motion.div
                  layoutId="schedule-day-pill"
                  className="absolute inset-0 rounded-full bg-violet-600/90 shadow-lg shadow-violet-500/25"
                  transition={{
                    type: 'spring',
                    bounce: 0.2,
                    duration: 0.5,
                  }}
                />
              )}
              <span className="relative z-[1] flex flex-col items-center gap-0.5">
                <span>{DAY_LABELS[day]}</span>
                {isToday && (
                  <span
                    className={`w-1 h-1 rounded-full ${
                      active ? 'bg-white' : 'bg-violet-400'
                    }`}
                  />
                )}
              </span>
            </button>
          );
        })}
      </div>

      {/* Grid */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-6"
          >
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[2/3] rounded-[32px] md:rounded-xl bg-white/[0.04] animate-pulse border border-white/5"
              />
            ))}
          </motion.div>
        ) : error ? (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-2xl border border-white/10 bg-white/5 px-6 py-16 text-center text-gray-400"
          >
            Could not load schedule. Please try again later.
          </motion.div>
        ) : schedule.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-2xl border border-white/10 bg-white/5 px-6 py-16 text-center text-gray-400"
          >
            No anime scheduled for this day.
          </motion.div>
        ) : (
          <motion.div
            key={selectedDay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-6"
          >
            {schedule.map((anime, i) => (
              <ScheduleCard
                key={anime.mal_id}
                anime={anime}
                index={i}
                isLive={checkAiringNow(anime.broadcastTime, selectedDay)}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
