// Jikan REST API (MyAnimeList) client — types kept compatible with existing UI components.

import type { MinimalAnime } from '@/types/anime';

export type Season = 'WINTER' | 'SPRING' | 'SUMMER' | 'FALL';
export type MediaFormat = 'TV' | 'TV_SHORT' | 'MOVIE' | 'SPECIAL' | 'OVA' | 'ONA' | 'MUSIC';
export type MediaSource =
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

export interface CoverImage {
  extraLarge: string;
}

export interface Studio {
  nodes: Array<{
    name: string;
  }>;
}

export interface StartDate {
  year: number | null;
  month: number | null;
  day: number | null;
}

export type AnimeStatus = 'RELEASING' | 'FINISHED' | 'NOT_YET_RELEASED' | 'CANCELLED' | 'HIATUS';

export interface Anime {
  mal_id: number;
  title: AnimeTitle;
  coverImage: CoverImage;
  description: string | null;
  genres: string[];
  episodes: number | null;
  studios: Studio;
  status: AnimeStatus;
  startDate: StartDate;
}

export interface CharacterName {
  full: string;
  native: string | null;
}

export interface CharacterImage {
  large: string;
}

export interface VoiceActor {
  name: CharacterName;
  image: CharacterImage;
  language: string;
}

export interface Character {
  node: {
    mal_id: number;
    name: CharacterName;
    image: CharacterImage;
  };
  role: string;
  voiceActors: VoiceActor[];
}

export interface RelationNode {
  mal_id: number;
  title: AnimeTitle;
  coverImage: CoverImage;
  format: MediaFormat | null;
}

export interface Relation {
  relationType: RelationType;
  node: RelationNode;
}

export interface ExternalLink {
  site: string;
  url: string;
  icon: string | null;
}

export interface StudioNode {
  name: string;
  isAnimationStudio: boolean;
}

export interface NextAiringEpisode {
  airingAt: number;
  timeUntilAiring: number;
  episode: number;
}

export interface AnimeDetail {
  mal_id: number;
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
  /** Jikan `broadcast.string` when useful for airing titles */
  broadcastSchedule: string | null;
}

const JIKAN_API_URL = 'https://api.jikan.moe/v4';

const serverCache: RequestInit = {
  next: { revalidate: 3600 },
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function jikanGet<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${JIKAN_API_URL}${path}`, {
    ...serverCache,
    ...init,
  });
  if (!response.ok) {
    throw new Error(`Jikan API error: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

interface JikanGenre {
  name: string;
}

interface JikanNameEntity {
  name: string;
}

interface JikanImages {
  webp?: {
    large_image_url?: string | null;
    small_image_url?: string | null;
    image_url?: string | null;
  };
  jpg?: {
    large_image_url?: string | null;
    small_image_url?: string | null;
    image_url?: string | null;
  };
}

interface JikanAnimeListItem {
  mal_id: number;
  title: string;
  title_english?: string | null;
  title_japanese?: string | null;
  images: JikanImages;
  synopsis?: string | null;
  genres?: JikanGenre[];
  themes?: JikanGenre[];
  demographics?: JikanGenre[];
  episodes?: number | null;
  studios?: JikanNameEntity[];
  producers?: JikanNameEntity[];
  status?: string;
  aired?: {
    prop?: {
      from?: { year?: number | null; month?: number | null; day?: number | null };
      to?: { year?: number | null; month?: number | null; day?: number | null };
    };
  };
  type?: string;
  source?: string;
  explicit_genres?: JikanGenre[];
}

interface JikanPaginatedAnime {
  pagination: {
    has_next_page: boolean;
    current_page: number;
  };
  data: JikanAnimeListItem[];
}

function webpLarge(images: JikanImages | undefined): string {
  const w = images?.webp?.large_image_url || images?.jpg?.large_image_url || '';
  return w || images?.jpg?.image_url || '';
}

function webpMedium(images: JikanImages | undefined): string {
  return (
    images?.webp?.small_image_url ||
    images?.webp?.image_url ||
    images?.jpg?.small_image_url ||
    images?.jpg?.image_url ||
    webpLarge(images)
  );
}

function hasAdultGenre(item: JikanAnimeListItem): boolean {
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

function mapJikanStatus(status: string | undefined): AnimeStatus {
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

function mapJikanType(type: string | undefined): MediaFormat | null {
  if (!type) return null;
  const t = type.toUpperCase().replace(/ /g, '_');
  const allowed: MediaFormat[] = ['TV', 'TV_SHORT', 'MOVIE', 'SPECIAL', 'OVA', 'ONA', 'MUSIC'];
  return (allowed.includes(t as MediaFormat) ? t : 'TV') as MediaFormat;
}

/** Jikan sometimes returns the same `mal_id` twice in one page or across pages; keep first occurrence. */
function dedupeByMalId<T extends { mal_id: number }>(items: T[]): T[] {
  const seen = new Set<number>();
  const out: T[] = [];
  for (const item of items) {
    if (seen.has(item.mal_id)) continue;
    seen.add(item.mal_id);
    out.push(item);
  }
  return out;
}

function mapJikanItemToAnime(item: JikanAnimeListItem): Anime {
  const english =
    item.title_english && item.title_english.trim() !== '' ? item.title_english.trim() : null;
  const romaji = item.title || 'Untitled';
  const cover = webpLarge(item.images);

  return {
    mal_id: item.mal_id,
    title: {
      english,
      romaji,
      native: item.title_japanese ?? null,
    },
    coverImage: { extraLarge: cover },
    description: item.synopsis ?? null,
    genres: [...new Set((item.genres ?? []).map((g) => g.name))],
    episodes: item.episodes ?? null,
    studios: {
      nodes: (item.studios ?? []).map((s) => ({ name: s.name })),
    },
    status: mapJikanStatus(item.status),
    startDate: {
      year: item.aired?.prop?.from?.year ?? null,
      month: item.aired?.prop?.from?.month ?? null,
      day: item.aired?.prop?.from?.day ?? null,
    },
  };
}

function seasonToJikanPath(season: Season): string {
  return season.toLowerCase();
}

export interface FetchAnimeParams {
  season?: Season;
  year?: number;
  search?: string;
}

async function fetchJikanAnimePage(path: string): Promise<{ items: Anime[]; hasNext: boolean }> {
  const json = await jikanGet<JikanPaginatedAnime>(path);
  const items = json.data
    .filter((item) => !hasAdultGenre(item))
    .map(mapJikanItemToAnime);
  return { items, hasNext: json.pagination.has_next_page };
}

/**
 * Season browse or search (paginated). Respects ~3 req/s with a short delay between pages.
 */
export async function fetchAnime(params: FetchAnimeParams): Promise<Anime[]> {
  const all: Anime[] = [];
  const perPage = 25;

  if (params.search?.trim()) {
    const q = encodeURIComponent(params.search.trim());
    let page = 1;
    let hasNext = true;
    const maxPages = 50;
    while (hasNext && page <= maxPages) {
      if (page > 1) await sleep(340);
      const path = `/anime?q=${q}&page=${page}&limit=${perPage}&order_by=popularity`;
      const { items, hasNext: next } = await fetchJikanAnimePage(path);
      all.push(...items);
      hasNext = next;
      page++;
    }
    return dedupeByMalId(all);
  }

  if (params.season == null || params.year == null) {
    return [];
  }

  const jSeason = seasonToJikanPath(params.season);
  let page = 1;
  let hasNext = true;
  const maxPages = 80;
  while (hasNext && page <= maxPages) {
    if (page > 1) await sleep(340);
    const path = `/seasons/${params.year}/${jSeason}?page=${page}&limit=${perPage}`;
    const { items, hasNext: next } = await fetchJikanAnimePage(path);
    all.push(...items);
    hasNext = next;
    page++;
  }

  const unique = dedupeByMalId(all);
  const desc = `${params.season} ${params.year}`;
  console.log(`Fetched ${unique.length} unique anime for ${desc} (${all.length} raw rows)`);
  return unique;
}

export type TrendingHeroAnime = Anime;

/** Top titles by MAL popularity (home hero). */
export async function fetchTrendingByPopularity(limit: number = 8): Promise<TrendingHeroAnime[]> {
  const pageLimit = Math.min(25, Math.max(limit * 3, limit + 8));
  const json = await jikanGet<JikanPaginatedAnime>(
    `/top/anime?filter=bypopularity&page=1&limit=${pageLimit}`
  );
  const mapped = json.data.filter((item) => !hasAdultGenre(item)).map(mapJikanItemToAnime);
  return dedupeByMalId(mapped).slice(0, limit);
}

/** Current season listings from Jikan (now airing catalog). */
export async function fetchSeasonNowAnime(limit: number = 6): Promise<Anime[]> {
  const pageLimit = Math.min(25, Math.max(limit * 4, limit + 12));
  const json = await jikanGet<JikanPaginatedAnime>(`/seasons/now?limit=${pageLimit}`);
  const mapped = json.data.filter((item) => !hasAdultGenre(item)).map(mapJikanItemToAnime);
  return dedupeByMalId(mapped).slice(0, limit);
}

/** Upcoming season listings. */
export async function fetchSeasonUpcomingAnime(limit: number = 6): Promise<Anime[]> {
  const pageLimit = Math.min(25, Math.max(limit * 4, limit + 12));
  const json = await jikanGet<JikanPaginatedAnime>(`/seasons/upcoming?limit=${pageLimit}`);
  const mapped = json.data.filter((item) => !hasAdultGenre(item)).map(mapJikanItemToAnime);
  return dedupeByMalId(mapped).slice(0, limit);
}

/**
 * Calendar season for browse links (WINTER after December uses the following calendar year).
 */
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

export interface SearchSuggestion {
  mal_id: number;
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

export async function fetchSearchSuggestions(
  searchTerm: string,
  limit: number = 5
): Promise<SearchSuggestion[]> {
  if (!searchTerm.trim()) return [];

  try {
    const q = encodeURIComponent(searchTerm.trim());
    const response = await fetch(
      `${JIKAN_API_URL}/anime?q=${q}&limit=${limit}&order_by=popularity`,
      typeof window === 'undefined' ? serverCache : undefined
    );
    if (!response.ok) return [];
    const json: JikanPaginatedAnime = await response.json();
    const mapped = json.data
      .filter((item) => !hasAdultGenre(item))
      .map((item) => {
        const english =
          item.title_english && item.title_english.trim() !== '' ? item.title_english.trim() : null;
        return {
          mal_id: item.mal_id,
          title: { romaji: item.title || 'Untitled', english },
          coverImage: { medium: webpMedium(item.images) },
          format: mapJikanType(item.type),
          startDate: { year: item.aired?.prop?.from?.year ?? null },
        };
      });
    return dedupeByMalId(mapped);
  } catch (error) {
    console.error('Error fetching search suggestions:', error);
    return [];
  }
}

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
