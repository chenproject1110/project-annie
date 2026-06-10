'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock } from 'lucide-react';
import { displayTitleForLanguage, useTitleLanguage } from '@/context/TitleLanguageContext';
import { anilistQuery, type AnimeTitle } from '@/lib/anilist';
import { useTracking, useTrackingStatus, TRACKING_BADGE } from '@/context/TrackingContext';

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
/*  Timezone handling                                                  */
/* ------------------------------------------------------------------ */

type TzMode = 'JST' | 'LOCAL';
const TZ_STORAGE_KEY = 'annie_schedule_tz';
const TZ_LABELS: Record<TzMode, string> = { JST: 'JST', LOCAL: 'Local' };
const TZ_ZONES: Record<TzMode, string | undefined> = {
  JST: 'Asia/Tokyo',
  LOCAL: undefined, // runtime local zone
};

function formatTime(airingAt: number, mode: TzMode): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: TZ_ZONES[mode],
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(airingAt * 1000));
}

/* ------------------------------------------------------------------ */
/*  JST schedule helpers (day grouping stays by Japanese broadcast day) */
/* ------------------------------------------------------------------ */

function getCurrentJSTDay(): DayKey {
  const name = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Tokyo',
    weekday: 'long',
  })
    .format(new Date())
    .toLowerCase();
  return (DAYS as readonly string[]).includes(name) ? (name as DayKey) : 'monday';
}

function jstWeekdayOf(airingAt: number): DayKey {
  const name = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Tokyo',
    weekday: 'long',
  })
    .format(new Date(airingAt * 1000))
    .toLowerCase();
  return (DAYS as readonly string[]).includes(name) ? (name as DayKey) : 'monday';
}

/** Live = a real episode just aired within the last 30 min (timezone-independent). */
function isLiveNow(airingAt: number): boolean {
  const now = Math.floor(Date.now() / 1000);
  return now >= airingAt && now - airingAt <= 30 * 60;
}

/* ------------------------------------------------------------------ */
/*  AniList airing schedule types & fetcher                            */
/* ------------------------------------------------------------------ */

interface ScheduleAnime {
  id: number;
  title: AnimeTitle;
  coverImage: string;
  airingAt: number;
  episode: number;
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
    const data = await anilistQuery<AniListSchedulePageResponse>(SCHEDULE_QUERY, {
      page,
      perPage: 50,
      start,
      end,
    });
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
      coverImage: entry.media.coverImage.extraLarge || entry.media.coverImage.large || '',
      airingAt: entry.airingAt,
      episode: entry.episode,
      episodes: entry.media.episodes,
      genres: entry.media.genres || [],
      studio: entry.media.studios?.nodes?.[0]?.name || '',
      status: entry.media.status === 'NOT_YET_RELEASED' ? 'upcoming' : 'airing',
    });
  }

  return [...seen.values()].sort((a, b) => a.airingAt - b.airingAt);
}

/* ------------------------------------------------------------------ */
/*  Per-day counts for the user's tracked shows                        */
/* ------------------------------------------------------------------ */

interface TrackedAiringResponse {
  Page: {
    pageInfo: { hasNextPage: boolean };
    media: Array<{ id: number; nextAiringEpisode: { airingAt: number } | null }>;
  };
}

const EMPTY_COUNTS: Record<DayKey, number> = {
  monday: 0,
  tuesday: 0,
  wednesday: 0,
  thursday: 0,
  friday: 0,
  saturday: 0,
  sunday: 0,
};

async function fetchTrackedAiringCounts(ids: number[]): Promise<Record<DayKey, number>> {
  const counts: Record<DayKey, number> = { ...EMPTY_COUNTS };
  if (ids.length === 0) return counts;
  try {
    // Page through the whole tracked list — currently-airing titles can sit
    // well past the first page once you've imported a large list.
    let page = 1;
    let hasNext = true;
    while (hasNext && page <= 20) {
      const data = await anilistQuery<TrackedAiringResponse>(
        `query ($ids: [Int], $page: Int) {
          Page(page: $page, perPage: 50) {
            pageInfo { hasNextPage }
            media(id_in: $ids, type: ANIME, status: RELEASING) {
              id
              nextAiringEpisode { airingAt }
            }
          }
        }`,
        { ids, page },
      );
      for (const m of data.Page.media) {
        if (m.nextAiringEpisode) counts[jstWeekdayOf(m.nextAiringEpisode.airingAt)] += 1;
      }
      hasNext = data.Page.pageInfo.hasNextPage;
      page += 1;
    }
  } catch {
    // counts stay zeroed — badges simply won't show
  }
  return counts;
}

/* ------------------------------------------------------------------ */
/*  Schedule card                                                      */
/* ------------------------------------------------------------------ */

const hoverShadow = '[text-shadow:0_1px_12px_rgba(0,0,0,0.95),0_0_2px_rgba(0,0,0,1)]';

function ScheduleCard({
  anime,
  index,
  isLive,
  tzMode,
}: {
  anime: ScheduleAnime;
  index: number;
  isLive: boolean;
  tzMode: TzMode;
}) {
  const trackingStatus = useTrackingStatus(anime.id);
  const { titleLanguage } = useTitleLanguage();
  const title = displayTitleForLanguage(anime.title, titleLanguage);
  const timeLabel = formatTime(anime.airingAt, tzMode);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.04, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link
        href={`/anime/${anime.id}`}
        className={`group relative flex flex-col rounded-[32px] md:rounded-xl overflow-hidden bg-surface shadow-lg transition-all duration-300 md:hover:scale-105 active:scale-95 md:active:scale-100 cursor-pointer ${
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

          {/* Time + episode badges (top-right, stacked) */}
          <div className="absolute top-2 right-2 z-[3] flex flex-col items-end gap-1">
            <div
              className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1 backdrop-blur-md shadow-sm ring-1 ${
                isLive
                  ? 'bg-violet-600/90 ring-violet-300/50 text-white'
                  : 'bg-black/75 ring-white/15 text-white'
              }`}
            >
              <Clock
                className={`h-3.5 w-3.5 ${isLive ? 'text-violet-100' : 'text-violet-300'}`}
                strokeWidth={2.5}
              />
              <span className="text-[13px] font-bold tabular-nums tracking-tight leading-none">
                {timeLabel}
              </span>
            </div>
            {anime.episode > 0 && (
              <div className="rounded-lg bg-black/75 px-2 py-0.5 backdrop-blur-md ring-1 ring-white/15 text-[10px] font-bold tabular-nums text-white/90">
                EP {anime.episode}
              </div>
            )}
          </div>

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
              {trackingStatus &&
                (() => {
                  const badge = TRACKING_BADGE[trackingStatus];
                  const BadgeIcon = badge.icon;
                  return (
                    <div
                      className={`self-start flex items-center gap-1 px-2 py-1 rounded-lg backdrop-blur-md border text-[10px] lg:text-xs font-semibold text-white ${badge.bg} ${badge.border}`}
                    >
                      <BadgeIcon className="w-3 h-3" strokeWidth={2.5} />
                      {badge.label}
                    </div>
                  );
                })()}
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
              <p className={`text-[11px] lg:text-xs text-white/70 ${hoverShadow}`}>
                Episode {anime.episode} · {timeLabel} {TZ_LABELS[tzMode]}
              </p>
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
          <div className="md:hidden absolute inset-x-0 bottom-0 z-[2] bg-gradient-to-t from-black via-black/80 to-transparent px-2.5 sm:px-3 pt-12 pb-1.5 sm:pb-2">
            {trackingStatus &&
              (() => {
                const badge = TRACKING_BADGE[trackingStatus];
                const BadgeIcon = badge.icon;
                return (
                  <div
                    className={`mb-1.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md backdrop-blur-md border text-[9px] sm:text-[10px] font-semibold text-white ${badge.bg} ${badge.border}`}
                  >
                    <BadgeIcon className="w-2.5 h-2.5" strokeWidth={2.5} />
                    {badge.label}
                  </div>
                );
              })()}
            <h3 className="text-xs sm:text-sm font-semibold text-white line-clamp-2 leading-snug">
              {title}
            </h3>
            <p className="text-[10px] sm:text-xs text-fg-muted line-clamp-1 mt-0.5">
              {anime.studio}
              {anime.episodes ? ` · ${anime.episodes} eps` : ''}
            </p>
          </div>

          {/* Desktop resting bar */}
          <div className="hidden md:block absolute inset-x-0 bottom-0 z-[1] bg-gradient-to-t from-black via-black/80 to-transparent px-3 pt-12 pb-2.5 group-hover:opacity-0 transition-opacity duration-300">
            <h3 className="text-sm font-semibold text-white line-clamp-2">{title}</h3>
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
  const { trackingMap } = useTracking();
  const [selectedDay, setSelectedDay] = useState<DayKey>('monday');
  const [schedule, setSchedule] = useState<ScheduleAnime[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [tick, setTick] = useState(0);
  const [tzMode, setTzMode] = useState<TzMode>('JST');
  const [followingOnly, setFollowingOnly] = useState(false);
  const [trackedCounts, setTrackedCounts] = useState<Record<DayKey, number>>(EMPTY_COUNTS);
  const cache = useRef<Partial<Record<DayKey, ScheduleAnime[]>>>({});
  const selectorRef = useRef<HTMLDivElement>(null);

  const trackedIds = useMemo(
    () => Object.keys(trackingMap).map(Number),
    [trackingMap],
  );
  const hasTracked = trackedIds.length > 0;

  // Restore timezone preference.
  useEffect(() => {
    const stored = localStorage.getItem(TZ_STORAGE_KEY) as TzMode | null;
    if (stored && stored in TZ_LABELS) setTzMode(stored);
  }, []);

  const changeTz = useCallback((mode: TzMode) => {
    setTzMode(mode);
    try {
      localStorage.setItem(TZ_STORAGE_KEY, mode);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    setSelectedDay(getCurrentJSTDay());
  }, []);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  // Per-day counts of the user's tracked shows.
  useEffect(() => {
    if (!hasTracked) {
      setTrackedCounts(EMPTY_COUNTS);
      return;
    }
    let cancelled = false;
    fetchTrackedAiringCounts(trackedIds).then((c) => {
      if (!cancelled) setTrackedCounts(c);
    });
    return () => {
      cancelled = true;
    };
  }, [trackedIds, hasTracked]);

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
    const btn = selectorRef.current.querySelector(`[data-day="${day}"]`) as HTMLElement | null;
    btn?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, []);

  useEffect(() => {
    scrollActiveIntoView(selectedDay);
  }, [selectedDay, scrollActiveIntoView]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const jstDay = useMemo(() => getCurrentJSTDay(), [tick]);

  const visible = useMemo(
    () => (followingOnly ? schedule.filter((a) => trackingMap[a.id] != null) : schedule),
    [followingOnly, schedule, trackingMap],
  );

  return (
    <section className="mx-auto max-w-7xl px-8 pt-2 pb-8 sm:pb-12" aria-label="Weekly airing schedule">
      <div className="mb-4 sm:mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl md:text-4xl font-bold text-fg tracking-tight">
            Weekly airing schedule
          </h1>
          <p className="text-fg-muted text-sm sm:text-base mt-1">
            Times shown in {TZ_LABELS[tzMode]}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Timezone segmented control */}
          <div className="flex items-center rounded-full bg-line/[0.04] border border-line/10 p-0.5">
            {(Object.keys(TZ_LABELS) as TzMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => changeTz(mode)}
                aria-pressed={tzMode === mode}
                className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                  tzMode === mode ? 'bg-violet-600 text-white' : 'text-fg-muted hover:text-fg'
                }`}
              >
                {TZ_LABELS[mode]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Day selector */}
      <div
        ref={selectorRef}
        className="relative mb-6 sm:mb-8 flex gap-0.5 overflow-x-auto scrollbar-hide rounded-full bg-line/[0.04] border border-line/10 px-1.5 py-2.5 backdrop-blur-lg"
        role="tablist"
        aria-label="Day of week"
      >
        {DAYS.map((day) => {
          const active = day === selectedDay;
          const isToday = day === jstDay;
          const count = trackedCounts[day];
          return (
            <button
              key={day}
              data-day={day}
              role="tab"
              aria-selected={active}
              onClick={() => setSelectedDay(day)}
              className={`relative z-[1] flex-1 min-w-[3rem] sm:min-w-[3.5rem] px-2 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm font-medium rounded-full transition-colors duration-200 whitespace-nowrap ${
                active ? 'text-white' : 'text-fg-muted hover:text-fg'
              }`}
            >
              {active && (
                <motion.div
                  layoutId="schedule-day-pill"
                  className="absolute inset-0 rounded-full bg-violet-600/90 shadow-lg shadow-violet-500/25"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                />
              )}
              {/* Selected day: corner badge — kept inside the tab so the scroll container can't crop it */}
              {hasTracked && count > 0 && active && (
                <span className="absolute -top-1 -right-0.5 z-[20] inline-flex h-4 min-w-4 items-center justify-center rounded-full border border-line/40 px-1 text-[9px] font-bold bg-white text-violet-700 shadow-sm">
                  {count}
                </span>
              )}
              <span className="relative z-[1] flex flex-col items-center gap-0.5">
                <span className="flex items-center gap-1">
                  {DAY_LABELS[day]}
                  {hasTracked && count > 0 && !active && (
                    <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full border border-line/40 px-1 text-[9px] font-bold bg-violet-600 text-white">
                      {count}
                    </span>
                  )}
                </span>
                {isToday && (
                  <span
                    className={`w-1 h-1 rounded-full ${active ? 'bg-white' : 'bg-violet-400'}`}
                  />
                )}
              </span>
            </button>
          );
        })}
      </div>

      {/* Following-only filter — below the weekday bar */}
      {hasTracked && (
        <div className="mb-6 sm:mb-8 -mt-2">
          <button
            type="button"
            onClick={() => setFollowingOnly((v) => !v)}
            aria-pressed={followingOnly}
            className={`min-h-9 rounded-full px-3.5 py-1.5 text-xs font-semibold border transition-colors active:scale-95 ${
              followingOnly
                ? 'bg-violet-600 border-violet-400/50 text-white'
                : 'bg-line/[0.04] border-line/10 text-fg-muted hover:text-fg'
            }`}
          >
            Following only
          </button>
        </div>
      )}

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
                className="aspect-[2/3] rounded-[32px] md:rounded-xl bg-line/[0.04] animate-pulse border border-line/5"
              />
            ))}
          </motion.div>
        ) : error ? (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-2xl border border-line/10 bg-line/5 px-6 py-16 text-center text-fg-muted"
          >
            Could not load schedule. Please try again later.
          </motion.div>
        ) : visible.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-2xl border border-line/10 bg-line/5 px-6 py-16 text-center text-fg-muted"
          >
            {followingOnly
              ? 'None of your tracked shows air on this day.'
              : 'No anime scheduled for this day.'}
          </motion.div>
        ) : (
          <motion.div
            key={`${selectedDay}-${followingOnly ? 'f' : 'a'}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-6"
          >
            {visible.map((anime, i) => (
              <ScheduleCard
                key={anime.id}
                anime={anime}
                index={i}
                tzMode={tzMode}
                isLive={isLive(anime)}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function isLive(anime: ScheduleAnime): boolean {
  return anime.status === 'airing' && isLiveNow(anime.airingAt);
}
