// Jikan REST API — detailed anime + shared formatters

import { cache } from 'react';
import type {
  AnimeDetail,
  Character,
  MediaFormat,
  MediaSource,
  Relation,
  RelationType,
} from './anilist';

const JIKAN_API_URL = 'https://api.jikan.moe/v4';

const serverCache: RequestInit = {
  next: { revalidate: 3600 },
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseRetryAfterMs(response: Response): number | null {
  const h = response.headers.get('Retry-After');
  if (!h) return null;
  const sec = parseInt(h, 10);
  if (!Number.isNaN(sec)) return sec * 1000;
  const when = Date.parse(h);
  if (!Number.isNaN(when)) return Math.max(0, when - Date.now());
  return null;
}

const JIKAN_RETRYABLE = new Set([429, 500, 502, 503, 504]);

async function jikanGet<T>(path: string): Promise<T> {
  const url = `${JIKAN_API_URL}${path}`;
  const maxAttempts = 8;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    let response: Response;
    try {
      response = await fetch(url, serverCache);
    } catch {
      if (attempt === maxAttempts - 1) {
        throw new Error('Jikan API error: network');
      }
      await sleep(Math.min(20_000, 900 * 2 ** attempt));
      continue;
    }

    if (response.ok) {
      return response.json() as Promise<T>;
    }

    const status = response.status;
    const retryable = JIKAN_RETRYABLE.has(status);
    if (!retryable || attempt === maxAttempts - 1) {
      throw new Error(`Jikan API error: ${status}`);
    }

    const fromHeader = parseRetryAfterMs(response);
    const backoff = fromHeader ?? Math.min(20_000, 900 * 2 ** attempt);
    await sleep(backoff);
  }

  throw new Error('Jikan API error: exhausted retries');
}

interface JikanImages {
  webp?: {
    large_image_url?: string | null;
    image_url?: string | null;
  };
  jpg?: {
    large_image_url?: string | null;
    image_url?: string | null;
  };
}

interface JikanFullAnime {
  mal_id: number;
  title: string;
  title_english?: string | null;
  title_japanese?: string | null;
  images: JikanImages;
  synopsis?: string | null;
  type?: string;
  source?: string;
  episodes?: number | null;
  duration?: string | null;
  status?: string;
  airing?: boolean;
  aired?: {
    prop?: {
      from?: { year?: number | null; month?: number | null; day?: number | null };
      to?: { year?: number | null; month?: number | null; day?: number | null };
    };
  };
  season?: string | null;
  year?: number | null;
  broadcast?: { string?: string | null };
  producers?: { name: string }[];
  studios?: { name: string }[];
  genres?: { name: string }[];
  relations?: {
    relation: string;
    entry: { mal_id: number; type: string; name: string; url: string }[];
  }[];
  external?: { name: string; url: string }[];
}

interface JikanAnimeById {
  data: JikanFullAnime;
}

interface JikanCharacterEntry {
  character: {
    mal_id: number;
    name: string;
    images: JikanImages & {
      jpg?: { image_url?: string | null };
      webp?: { image_url?: string | null; small_image_url?: string | null };
    };
  };
  role: string;
  voice_actors?: {
    person: {
      name: string;
      images?: { jpg?: { image_url?: string | null } };
    };
    language: string;
  }[];
}

interface JikanCharactersResponse {
  data: JikanCharacterEntry[];
}

function webpLarge(images: JikanImages | undefined): string {
  return (
    images?.webp?.large_image_url ||
    images?.jpg?.large_image_url ||
    images?.jpg?.image_url ||
    ''
  );
}

function characterImageLarge(
  images: JikanCharacterEntry['character']['images'] | undefined
): string {
  if (!images) return '';
  const w = images.webp?.image_url || images.webp?.small_image_url;
  const j = images.jpg?.image_url;
  return w || j || '';
}

function mapJikanStatus(
  status: string | undefined,
  airing: boolean | undefined
): AnimeDetail['status'] {
  if (airing) return 'RELEASING';
  switch (status) {
    case 'Currently Airing':
      return 'RELEASING';
    case 'Finished Airing':
      return 'FINISHED';
    case 'Not yet aired':
      return 'NOT_YET_RELEASED';
    default:
      return 'FINISHED';
  }
}

function mapJikanType(type: string | undefined): MediaFormat {
  if (!type) return 'TV';
  const t = type.toUpperCase().replace(/ /g, '_');
  const allowed: MediaFormat[] = ['TV', 'TV_SHORT', 'MOVIE', 'SPECIAL', 'OVA', 'ONA', 'MUSIC'];
  return (allowed.includes(t as MediaFormat) ? t : 'TV') as MediaFormat;
}

function mapJikanSource(src: string | undefined): MediaSource | null {
  if (!src) return null;
  const key = src.trim().toLowerCase();
  const m: Record<string, MediaSource> = {
    original: 'ORIGINAL',
    manga: 'MANGA',
    'light novel': 'LIGHT_NOVEL',
    'visual novel': 'VISUAL_NOVEL',
    'video game': 'VIDEO_GAME',
    novel: 'NOVEL',
    'web novel': 'WEB_NOVEL',
    game: 'GAME',
    'card game': 'GAME',
    'picture book': 'PICTURE_BOOK',
    music: 'OTHER',
    '4-koma manga': 'MANGA',
    other: 'OTHER',
  };
  return m[key] || 'OTHER';
}

function mapSeason(
  s: string | null | undefined,
  y: number | null | undefined
): { season: AnimeDetail['season']; seasonYear: number | null } {
  if (!s || y == null) return { season: null, seasonYear: null };
  const map: Record<string, NonNullable<AnimeDetail['season']>> = {
    winter: 'WINTER',
    spring: 'SPRING',
    summer: 'SUMMER',
    fall: 'FALL',
  };
  const season = map[s.toLowerCase()] ?? null;
  return { season, seasonYear: y };
}

function mapJikanRelationType(rel: string): RelationType {
  const key = rel.toLowerCase().replace(/\s+/g, '_');
  const m: Record<string, RelationType> = {
    adaptation: 'ADAPTATION',
    side_story: 'SIDE_STORY',
    sequel: 'SEQUEL',
    prequel: 'PREQUEL',
    summary: 'SUMMARY',
    alternative_version: 'ALTERNATIVE',
    alternative_setting: 'ALTERNATIVE',
    spin_off: 'SPIN_OFF',
    parent_story: 'PARENT',
    full_story: 'PARENT',
    character: 'CHARACTER',
    other: 'OTHER',
    compilation: 'COMPILATION',
    contains: 'CONTAINS',
    source: 'SOURCE',
  };
  return m[key] || 'OTHER';
}

async function fetchCoverForMal(malId: number): Promise<string> {
  const json = await jikanGet<JikanAnimeById>(`/anime/${malId}`);
  return webpLarge(json.data.images);
}

/** Small parallel batches to reduce 429s while avoiding serial sleeps (~3s+ before). */
const RELATION_COVER_CONCURRENCY = 3;

async function fetchRelationCoversMap(ids: number[]): Promise<Map<number, string>> {
  const coverByMal = new Map<number, string>();
  for (let i = 0; i < ids.length; i += RELATION_COVER_CONCURRENCY) {
    const batch = ids.slice(i, i + RELATION_COVER_CONCURRENCY);
    const results = await Promise.allSettled(
      batch.map(async (id) => {
        const url = await fetchCoverForMal(id);
        return { id, url };
      })
    );
    for (const r of results) {
      if (r.status === 'fulfilled' && r.value.url) {
        coverByMal.set(r.value.id, r.value.url);
      }
    }
  }
  return coverByMal;
}

async function fetchAnimeDetailUncached(malId: number): Promise<AnimeDetail> {
  const [full, charResult] = await Promise.all([
    jikanGet<JikanAnimeById>(`/anime/${malId}/full`),
    jikanGet<JikanCharactersResponse>(`/anime/${malId}/characters`).catch(
      (): JikanCharactersResponse => ({ data: [] })
    ),
  ]);
  const data = full.data;
  const charJson = charResult;

  const relationAnimeIds: number[] = [];
  for (const rel of data.relations ?? []) {
    for (const ent of rel.entry ?? []) {
      if (ent.type === 'anime') relationAnimeIds.push(ent.mal_id);
    }
  }
  const uniqueIds = [...new Set(relationAnimeIds)].slice(0, 10);
  const coverByMal = await fetchRelationCoversMap(uniqueIds);

  const english =
    data.title_english && data.title_english.trim() !== '' ? data.title_english.trim() : null;
  const romaji = data.title || 'Untitled';

  const edges: Relation[] = [];
  const seenRelatedMal = new Set<number>();
  for (const rel of data.relations ?? []) {
    const relationType = mapJikanRelationType(rel.relation);
    for (const ent of rel.entry ?? []) {
      if (ent.type !== 'anime') continue;
      if (seenRelatedMal.has(ent.mal_id)) continue;
      seenRelatedMal.add(ent.mal_id);
      const coverUrl = coverByMal.get(ent.mal_id) || '';
      edges.push({
        relationType,
        node: {
          mal_id: ent.mal_id,
          title: { english: null, romaji: ent.name, native: null },
          coverImage: { extraLarge: coverUrl },
          format: null,
        },
      });
    }
  }

  const characterEdges: Character[] = (charJson.data ?? []).slice(0, 25).map((entry) => {
    const jp = (entry.voice_actors ?? []).filter((v) => v.language === 'Japanese');
    const va = jp[0];
    return {
      role: entry.role,
      node: {
        mal_id: entry.character.mal_id,
        name: { full: entry.character.name, native: null },
        image: { large: characterImageLarge(entry.character.images) },
      },
      voiceActors: va
        ? [
            {
              name: { full: va.person.name, native: null },
              image: { large: va.person.images?.jpg?.image_url || '' },
              language: va.language,
            },
          ]
        : [],
    };
  });

  const studioNodes = [
    ...(data.studios ?? []).map((s) => ({ name: s.name, isAnimationStudio: true })),
    ...(data.producers ?? []).map((s) => ({ name: s.name, isAnimationStudio: false })),
  ];

  const { season, seasonYear } = mapSeason(data.season ?? null, data.year ?? null);

  const detail: AnimeDetail = {
    mal_id: data.mal_id,
    title: {
      english,
      romaji,
      native: data.title_japanese ?? null,
    },
    coverImage: { extraLarge: webpLarge(data.images) },
    description: data.synopsis ?? null,
    format: mapJikanType(data.type),
    episodes: data.episodes ?? null,
    duration: data.duration ?? null,
    status: mapJikanStatus(data.status, data.airing),
    season,
    seasonYear,
    source: mapJikanSource(data.source),
    startDate: {
      year: data.aired?.prop?.from?.year ?? null,
      month: data.aired?.prop?.from?.month ?? null,
      day: data.aired?.prop?.from?.day ?? null,
    },
    endDate: {
      year: data.aired?.prop?.to?.year ?? null,
      month: data.aired?.prop?.to?.month ?? null,
      day: data.aired?.prop?.to?.day ?? null,
    },
    genres: [...new Set((data.genres ?? []).map((g) => g.name))],
    studios: { nodes: studioNodes },
    relations: { edges },
    characters: { edges: characterEdges },
    externalLinks: (data.external ?? []).map((e) => ({
      site: e.name,
      url: e.url,
      icon: null,
    })),
    nextAiringEpisode: null,
    broadcastSchedule: data.broadcast?.string?.trim() || null,
  };

  return detail;
}

/**
 * Per-request dedupe: `generateMetadata` and the page both call this; only one Jikan pipeline runs.
 */
export const fetchAnimeDetail = cache(fetchAnimeDetailUncached);

export function formatDateJST(date: {
  year: number | null;
  month: number | null;
  day: number | null;
}): string {
  const { year, month, day } = date;

  if (!year) return 'TBA';

  const dateObj = new Date(year, (month || 1) - 1, day || 1);

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return formatter.format(dateObj);
}

export function filterExternalLinks(links: Array<{ site: string; url: string; icon: string | null }>) {
  return links.filter((link) => {
    const s = link.site.toLowerCase();
    return (
      s.includes('official') ||
      s.includes('twitter') ||
      s.includes('x (twitter)') ||
      s.includes('youtube')
    );
  });
}

export function formatMediaFormat(format: string): string {
  const formatMap: Record<string, string> = {
    TV: 'TV Series',
    TV_SHORT: 'TV Short',
    MOVIE: 'Movie',
    SPECIAL: 'Special',
    OVA: 'OVA',
    ONA: 'ONA',
    MUSIC: 'Music',
  };
  return formatMap[format] || format;
}

export function formatMediaSource(source: string | null): string {
  if (!source) return 'Unknown';

  const sourceMap: Record<string, string> = {
    ORIGINAL: 'Original',
    MANGA: 'Manga',
    LIGHT_NOVEL: 'Light Novel',
    VISUAL_NOVEL: 'Visual Novel',
    VIDEO_GAME: 'Video Game',
    OTHER: 'Other',
    NOVEL: 'Novel',
    DOUJINSHI: 'Doujinshi',
    ANIME: 'Anime',
    WEB_NOVEL: 'Web Novel',
    LIVE_ACTION: 'Live Action',
    GAME: 'Game',
    COMIC: 'Comic',
    MULTIMEDIA_PROJECT: 'Multimedia Project',
    PICTURE_BOOK: 'Picture Book',
  };
  return sourceMap[source] || source;
}

export function formatRelationType(type: string): string {
  if (type.includes(' ') && !type.includes('_')) {
    return type;
  }
  const typeMap: Record<string, string> = {
    ADAPTATION: 'Adaptation',
    PREQUEL: 'Prequel',
    SEQUEL: 'Sequel',
    PARENT: 'Parent Story',
    SIDE_STORY: 'Side Story',
    CHARACTER: 'Character',
    SUMMARY: 'Summary',
    ALTERNATIVE: 'Alternative',
    SPIN_OFF: 'Spin-off',
    OTHER: 'Other',
    SOURCE: 'Source Material',
    COMPILATION: 'Compilation',
    CONTAINS: 'Contains',
  };
  return typeMap[type] || type.replace(/_/g, ' ');
}

export function formatBroadcastSchedule(airingAt: number): string {
  const date = new Date(airingAt * 1000);

  const dayFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Tokyo',
    weekday: 'long',
  });
  const dayOfWeek = dayFormatter.format(date);

  const timeFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Tokyo',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const time = timeFormatter.format(date);

  return `${dayOfWeek}s at ${time} (JST)`;
}

export function formatTimeUntilAiring(timeUntilAiring: number, episode: number): string {
  const seconds = timeUntilAiring;
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  let timeString = '';
  if (days > 0) {
    timeString = `${days} day${days > 1 ? 's' : ''}`;
  } else if (hours > 0) {
    timeString = `${hours} hour${hours > 1 ? 's' : ''}`;
  } else {
    timeString = `${minutes} minute${minutes > 1 ? 's' : ''}`;
  }

  return `Episode ${episode} in ${timeString}`;
}
