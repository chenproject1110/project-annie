// AniList GraphQL API client — all data sourced from AniList.

import type { MinimalAnime } from '@/types/anime';

export type Season = 'WINTER' | 'SPRING' | 'SUMMER' | 'FALL';
export type MediaFormat = 'TV' | 'TV_SHORT' | 'MOVIE' | 'SPECIAL' | 'OVA' | 'ONA' | 'MUSIC';
type MediaSource =
  | 'ORIGINAL'
  | 'MANGA'
  | 'LIGHT_NOVEL'
  | 'VISUAL_NOVEL'
  | 'VIDEO_GAME'
  | 'OTHER'
  | 'NOVEL'
  | 'DOUJINSHI'
  | 'ANIME'
  | 'WEB_NOVEL'
  | 'LIVE_ACTION'
  | 'GAME'
  | 'COMIC'
  | 'MULTIMEDIA_PROJECT'
  | 'PICTURE_BOOK';
export type RelationType =
  | 'ADAPTATION'
  | 'PREQUEL'
  | 'SEQUEL'
  | 'PARENT'
  | 'SIDE_STORY'
  | 'CHARACTER'
  | 'SUMMARY'
  | 'ALTERNATIVE'
  | 'SPIN_OFF'
  | 'OTHER'
  | 'SOURCE'
  | 'COMPILATION'
  | 'CONTAINS';

export interface AnimeTitle {
  english: string | null;
  romaji: string;
  native: string | null;
}

interface CoverImage {
  extraLarge: string;
  large?: string | null;
  color?: string | null;
}

interface Studio {
  nodes: Array<{
    name: string;
  }>;
}

interface StartDate {
  year: number | null;
  month: number | null;
  day: number | null;
}

type AnimeStatus = 'RELEASING' | 'FINISHED' | 'NOT_YET_RELEASED' | 'CANCELLED' | 'HIATUS';

export interface Anime {
  id: number;
  title: AnimeTitle;
  coverImage: CoverImage;
  bannerImage?: string | null;
  description: string | null;
  genres: string[];
  episodes: number | null;
  studios: Studio;
  status: AnimeStatus;
  startDate: StartDate;
}

interface CharacterName {
  full: string;
  native: string | null;
}

interface CharacterImage {
  large: string;
}

export interface VoiceActor {
  name: CharacterName;
  image: CharacterImage;
  language: string;
}

export interface Character {
  node: {
    id: number;
    name: CharacterName;
    image: CharacterImage;
  };
  role: string;
  voiceActors: VoiceActor[];
}

interface RelationNode {
  id: number;
  title: AnimeTitle;
  coverImage: CoverImage;
  format: MediaFormat | null;
}

export interface Relation {
  relationType: RelationType;
  node: RelationNode;
}

interface ExternalLink {
  site: string;
  url: string;
  icon: string | null;
}

interface StudioNode {
  name: string;
  isAnimationStudio: boolean;
}

interface NextAiringEpisode {
  airingAt: number;
  timeUntilAiring: number;
  episode: number;
}

export interface AnimeDetail {
  id: number;
  idMal: number | null;
  title: AnimeTitle;
  coverImage: CoverImage;
  description: string | null;
  format: MediaFormat;
  episodes: number | null;
  duration: string | null;
  status: AnimeStatus;
  season: Season | null;
  seasonYear: number | null;
  source: MediaSource | null;
  startDate: StartDate;
  endDate: StartDate;
  genres: string[];
  studios: {
    nodes: StudioNode[];
  };
  relations: {
    edges: Relation[];
  };
  characters: {
    edges: Character[];
  };
  externalLinks: ExternalLink[];
  nextAiringEpisode: NextAiringEpisode | null;
  broadcastSchedule: string | null;
}

/* ------------------------------------------------------------------ */
/*  AniList GraphQL transport                                          */
/* ------------------------------------------------------------------ */

const ANILIST_API = 'https://graphql.anilist.co';

const serverCache: RequestInit = {
  next: { revalidate: 3600 },
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function anilistQuery<T>(
  query: string,
  variables: Record<string, unknown> = {},
  init?: RequestInit,
): Promise<T> {
  const isServer = typeof window === 'undefined';
  const maxAttempts = 3;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    let response: Response;
    try {
      response = await fetch(ANILIST_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ query, variables }),
        ...(isServer ? serverCache : {}),
        ...init,
      });
    } catch {
      if (attempt === maxAttempts - 1) throw new Error('AniList API error: network');
      await sleep(1000 * 2 ** attempt);
      continue;
    }

    if (response.ok) {
      const json = await response.json();
      if (json.errors?.length) {
        throw new Error(`AniList API error: ${json.errors[0].message}`);
      }
      return json.data as T;
    }

    if (response.status === 429 && attempt < maxAttempts - 1) {
      const retryAfter = response.headers.get('Retry-After');
      await sleep(retryAfter ? parseInt(retryAfter, 10) * 1000 : 5000);
      continue;
    }

    throw new Error(`AniList API error: ${response.status}`);
  }

  throw new Error('AniList API error: exhausted retries');
}

/* ------------------------------------------------------------------ */
/*  Shared GraphQL fragments                                           */
/* ------------------------------------------------------------------ */

const ANIME_LIST_FIELDS = `
  id
  title { romaji english native }
  coverImage { extraLarge large color }
  bannerImage
  description
  genres
  episodes
  studios(isMain: true) { nodes { name } }
  status
  startDate { year month day }
`;

/* ------------------------------------------------------------------ */
/*  Response types (private)                                           */
/* ------------------------------------------------------------------ */

interface AniListMediaItem {
  id: number;
  title: { romaji: string; english: string | null; native: string | null };
  coverImage: { extraLarge: string; large: string | null; color: string | null };
  bannerImage: string | null;
  description: string | null;
  genres: string[];
  episodes: number | null;
  studios: { nodes: Array<{ name: string }> };
  status: string;
  startDate: { year: number | null; month: number | null; day: number | null };
}

interface AniListPageResponse {
  Page: {
    pageInfo: { hasNextPage: boolean };
    media: AniListMediaItem[];
  };
}

/* ------------------------------------------------------------------ */
/*  Mapping                                                            */
/* ------------------------------------------------------------------ */

function mapMedia(m: AniListMediaItem): Anime {
  return {
    id: m.id,
    title: {
      english: m.title.english || null,
      romaji: m.title.romaji || 'Untitled',
      native: m.title.native || null,
    },
    coverImage: {
      extraLarge: m.coverImage?.extraLarge || '',
      large: m.coverImage?.large,
      color: m.coverImage?.color,
    },
    bannerImage: m.bannerImage,
    description: m.description,
    genres: m.genres || [],
    episodes: m.episodes,
    studios: { nodes: m.studios?.nodes || [] },
    status: (m.status as AnimeStatus) || 'FINISHED',
    startDate: m.startDate || { year: null, month: null, day: null },
  };
}

/* ------------------------------------------------------------------ */
/*  Public fetchers                                                    */
/* ------------------------------------------------------------------ */

interface FetchAnimeParams {
  season?: Season;
  year?: number;
  search?: string;
}

export async function fetchAnime(params: FetchAnimeParams): Promise<Anime[]> {
  const perPage = 50;

  if (params.search?.trim()) {
    const all: Anime[] = [];
    let page = 1;
    let hasNext = true;
    while (hasNext && page <= 10) {
      const data = await anilistQuery<AniListPageResponse>(
        `query ($search: String, $page: Int, $perPage: Int) {
          Page(page: $page, perPage: $perPage) {
            pageInfo { hasNextPage }
            media(search: $search, sort: SEARCH_MATCH, type: ANIME, isAdult: false, format_not_in: [ONA, TV_SHORT]) {
              ${ANIME_LIST_FIELDS}
            }
          }
        }`,
        { search: params.search.trim(), page, perPage },
      );
      all.push(...data.Page.media.map(mapMedia));
      hasNext = data.Page.pageInfo.hasNextPage;
      page++;
    }
    return all;
  }

  if (params.season == null || params.year == null) return [];

  const all: Anime[] = [];
  let page = 1;
  let hasNext = true;
  while (hasNext && page <= 20) {
    const data = await anilistQuery<AniListPageResponse>(
      `query ($season: MediaSeason, $year: Int, $page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          pageInfo { hasNextPage }
          media(season: $season, seasonYear: $year, sort: POPULARITY_DESC, type: ANIME, isAdult: false, format_not_in: [ONA, TV_SHORT]) {
            ${ANIME_LIST_FIELDS}
          }
        }
      }`,
      { season: params.season, year: params.year, page, perPage },
    );
    all.push(...data.Page.media.map(mapMedia));
    hasNext = data.Page.pageInfo.hasNextPage;
    page++;
  }

  return all;
}

export async function fetchTrendingByPopularity(limit: number = 8): Promise<Anime[]> {
  const data = await anilistQuery<AniListPageResponse>(
    `query ($perPage: Int) {
      Page(page: 1, perPage: $perPage) {
        pageInfo { hasNextPage }
        media(sort: TRENDING_DESC, type: ANIME, isAdult: false, format_not_in: [ONA, TV_SHORT]) {
          ${ANIME_LIST_FIELDS}
        }
      }
    }`,
    { perPage: limit },
  );
  return data.Page.media.map(mapMedia);
}

export async function fetchSeasonNowAnime(limit: number = 6): Promise<Anime[]> {
  const { season, year } = getAnimeSeasonNow();
  const data = await anilistQuery<AniListPageResponse>(
    `query ($season: MediaSeason, $year: Int, $perPage: Int) {
      Page(page: 1, perPage: $perPage) {
        pageInfo { hasNextPage }
        media(season: $season, seasonYear: $year, sort: POPULARITY_DESC, type: ANIME, isAdult: false, status: RELEASING, format_not_in: [ONA, TV_SHORT]) {
          ${ANIME_LIST_FIELDS}
        }
      }
    }`,
    { season, year, perPage: limit },
  );
  return data.Page.media.map(mapMedia);
}

export async function fetchSeasonUpcomingAnime(limit: number = 6): Promise<Anime[]> {
  const data = await anilistQuery<AniListPageResponse>(
    `query ($perPage: Int) {
      Page(page: 1, perPage: $perPage) {
        pageInfo { hasNextPage }
        media(sort: POPULARITY_DESC, type: ANIME, isAdult: false, status: NOT_YET_RELEASED, format_not_in: [ONA, TV_SHORT]) {
          ${ANIME_LIST_FIELDS}
        }
      }
    }`,
    { perPage: limit },
  );
  return data.Page.media.map(mapMedia);
}

/* ------------------------------------------------------------------ */
/*  Season helpers                                                     */
/* ------------------------------------------------------------------ */

export function getAnimeSeasonNow(d: Date = new Date()): { season: Season; year: number } {
  const month = d.getMonth();
  const year = d.getFullYear();
  if (month === 11) return { season: 'WINTER', year: year + 1 };
  if (month <= 1) return { season: 'WINTER', year };
  if (month >= 2 && month <= 4) return { season: 'SPRING', year };
  if (month >= 5 && month <= 7) return { season: 'SUMMER', year };
  return { season: 'FALL', year };
}

export function getNextSeason(season: Season, year: number): { season: Season; year: number } {
  const order: Season[] = ['WINTER', 'SPRING', 'SUMMER', 'FALL'];
  const i = order.indexOf(season);
  if (i === 3) return { season: 'WINTER', year: year + 1 };
  return { season: order[i + 1], year };
}

/* ------------------------------------------------------------------ */
/*  Search suggestions                                                 */
/* ------------------------------------------------------------------ */

export interface SearchSuggestion {
  id: number;
  title: {
    romaji: string;
    english: string | null;
  };
  coverImage: {
    medium: string;
  };
  format: MediaFormat | null;
  startDate: {
    year: number | null;
  };
}

interface AniListSuggestionResponse {
  Page: {
    media: Array<{
      id: number;
      title: { romaji: string; english: string | null };
      coverImage: { medium: string };
      format: string | null;
      startDate: { year: number | null };
    }>;
  };
}

export async function fetchSearchSuggestions(
  searchTerm: string,
  limit: number = 5,
): Promise<SearchSuggestion[]> {
  if (!searchTerm.trim()) return [];

  try {
    const data = await anilistQuery<AniListSuggestionResponse>(
      `query ($search: String, $perPage: Int) {
        Page(page: 1, perPage: $perPage) {
            media(search: $search, sort: SEARCH_MATCH, type: ANIME, isAdult: false, format_not_in: [ONA, TV_SHORT]) {
            id
            title { romaji english }
            coverImage { medium }
            format
            startDate { year }
          }
        }
      }`,
      { search: searchTerm.trim(), perPage: limit },
    );
    return data.Page.media.map((m) => ({
      id: m.id,
      title: { romaji: m.title.romaji || 'Untitled', english: m.title.english },
      coverImage: { medium: m.coverImage?.medium || '' },
      format: (m.format as MediaFormat) || null,
      startDate: { year: m.startDate?.year ?? null },
    }));
  } catch (error) {
    console.error('Error fetching search suggestions:', error);
    return [];
  }
}

/* ------------------------------------------------------------------ */
/*  Display helpers                                                    */
/* ------------------------------------------------------------------ */

export function getPrimaryStudio(anime: Pick<Anime, 'studios'>): string {
  if (anime.studios?.nodes && anime.studios.nodes.length > 0) {
    return anime.studios.nodes[0].name;
  }
  return 'Unknown Studio';
}

export function getDisplayTitle(anime: MinimalAnime): string {
  return anime.title.english || anime.title.romaji;
}

export function stripHtml(html: string | null): string {
  if (!html) return 'No description available.';
  return html.replace(/<[^>]*>/g, '');
}

export function getStatusLabel(status: AnimeStatus): string {
  const statusMap: Record<AnimeStatus, string> = {
    RELEASING: 'Ongoing',
    FINISHED: 'Finished',
    NOT_YET_RELEASED: 'Upcoming',
    CANCELLED: 'Cancelled',
    HIATUS: 'Hiatus',
  };
  return statusMap[status] || status;
}

export function formatDateGMT8(startDate: StartDate): string {
  const { year, month, day } = startDate;

  if (!year) return 'TBA';

  const date = new Date(year, (month || 1) - 1, day || 1);

  const formatter = new Intl.DateTimeFormat('en-MY', {
    timeZone: 'Asia/Kuala_Lumpur',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return formatter.format(date);
}

export function getReleaseLabel(status: AnimeStatus): string {
  return status === 'NOT_YET_RELEASED' ? 'Releasing on' : 'Released on';
}
