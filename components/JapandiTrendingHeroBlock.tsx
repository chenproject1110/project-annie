'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock } from 'lucide-react';
import { displayTitleForLanguage, useTitleLanguage } from '@/context/TitleLanguageContext';
import { anilistQuery, type AnimeTitle } from '@/lib/anilist';

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
/*  AniList airing schedule types & fetcher                            */
/* ------------------------------------------------------------------ */

interface ScheduleAnime {
  id: number;
  title: AnimeTitle;
  coverImage: string;
  broadcastTime: string | null;
  episodes: number | null;
  genres: string[];
  studio: string;
  status: 'airing' | 'upcoming';
}

const SCHEDULE_QUERY = `
  query ($page: Int, $perPage: Int, $start: Int, $end: Int) {
    Page(page: $page, perPage: $perPage) {
      pageInfo { hasNextPage }
      airingSchedules(airingAt_greater: $start, airingAt_lesser: $end, sort: TIME) {
        airingAt
        episode
        media {
          id
          format
          title { romaji english native }
          coverImage { extraLarge large }
          episodes
          genres
          studios(isMain: true) { nodes { name } }
          status
          isAdult
        }
      }
    }
  }
`;

interface AniListAiringEntry {
  airingAt: number;
  episode: number;
  media: {
    id: number;
    format: string | null;
    title: { romaji: string; english: string | null; native: string | null };
    coverImage: { extraLarge: string; large: string | null };
    episodes: number | null;
    genres: string[];
    studios: { nodes: Array<{ name: string }> };
    status: string;
    isAdult: boolean;
  };
}

function formatJSTTime(airingAt: number): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Tokyo',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(airingAt * 1000));
}

/** Compute the UTC unix-second range for a given day-of-week in the current JST week. */
function getJSTWeekDayRange(day: DayKey): [number, number] {
  const JST_OFFSET = 9 * 3600;
  const nowUnix = Math.floor(Date.now() / 1000);

  const jstTime = nowUnix + JST_OFFSET;
  const todayMidnightJST = Math.floor(jstTime / 86400) * 86400 - JST_OFFSET;

  const todayDate = new Date((todayMidnightJST + JST_OFFSET) * 1000);
  const todayDayNum = todayDate.getUTCDay(); // 0=Sun

  const mondayOffset = todayDayNum === 0 ? -6 : 1 - todayDayNum;
  const mondayMidnight = todayMidnightJST + mondayOffset * 86400;

  const dayFromMonday: Record<DayKey, number> = {
    monday: 0,
    tuesday: 1,
    wednesday: 2,
    thursday: 3,
    friday: 4,
    saturday: 5,
    sunday: 6,
  };

  const targetMidnight = mondayMidnight + dayFromMonday[day] * 86400;
  // airingAt_greater is strict >, so subtract 1 to include shows airing exactly at midnight JST
  return [targetMidnight - 1, targetMidnight + 86400];
}

interface AniListSchedulePageResponse {
  Page: {
    pageInfo: { hasNextPage: boolean };
    airingSchedules: AniListAiringEntry[];
  };
}

async function fetchSchedule(day: DayKey): Promise<ScheduleAnime[]> {
  const [start, end] = getJSTWeekDayRange(day);

  const entries: AniListAiringEntry[] = [];
  let page = 1;
  let hasNext = true;

  while (hasNext && page <= 3) {
    const data = await anilistQuery<AniListSchedulePageResponse>(
      SCHEDULE_QUERY,
      { page, perPage: 50, start, end },
    );
    entries.push(...(data.Page.airingSchedules || []));
    hasNext = data.Page.pageInfo.hasNextPage;
    page++;
  }

  const seen = new Map<number, ScheduleAnime>();
  for (const entry of entries) {
    if (entry.media.isAdult) continue;
    const fmt = entry.media.format;
    if (fmt === 'ONA' || fmt === 'TV_SHORT') continue;
    if (seen.has(entry.media.id)) continue;

    seen.set(entry.media.id, {
      id: entry.media.id,
      title: {
        english: entry.media.title.english || null,
        romaji: entry.media.title.romaji || 'Untitled',
        native: entry.media.title.native || null,
      },
      coverImage:
        entry.media.coverImage.extraLarge ||
        entry.media.coverImage.large ||
        '',
      broadcastTime: formatJSTTime(entry.airingAt),
      episodes: entry.media.episodes,
      genres: entry.media.genres || [],
      studio: entry.media.studios?.nodes?.[0]?.name || '',
      status:
        entry.media.status === 'NOT_YET_RELEASED' ? 'upcoming' : 'airing',
    });
  }

  const result = [...seen.values()];
  result.sort((a, b) => {
    if (!a.broadcastTime && !b.broadcastTime) return 0;
    if (!a.broadcastTime) return 1;
    if (!b.broadcastTime) return -1;
    return a.broadcastTime.localeCompare(b.broadcastTime);
  });

  return result;
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
        href={`/anime/${anime.id}`}
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

          {/* Upcoming badge */}
          {!isLive && anime.status === 'upcoming' && (
            <div className="absolute top-2 left-2 z-[3] flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-500/20 backdrop-blur-md border border-amber-400/30">
              <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-400" />
              <span className="text-[10px] font-bold text-amber-200 uppercase tracking-wider">
                Upcoming
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
                key={anime.id}
                anime={anime}
                index={i}
                isLive={anime.status === 'airing' && checkAiringNow(anime.broadcastTime, selectedDay)}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
