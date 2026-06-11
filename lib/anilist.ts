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
  id: number;
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
  id: number;
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
  genres?: string[];
  formats?: string[];
  studio?: string;
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

  const genres = (params.genres ?? []).filter(Boolean);
  const formats = (params.formats ?? []).filter(Boolean);

  const varDefs = ['$season: MediaSeason', '$year: Int', '$page: Int', '$perPage: Int'];
  const mediaArgs = [
    'season: $season',
    'seasonYear: $year',
    'sort: POPULARITY_DESC',
    'type: ANIME',
    'isAdult: false',
  ];
  const baseVars: Record<string, unknown> = { season: params.season, year: params.year };

  if (genres.length > 0) {
    varDefs.push('$genres: [String]');
    mediaArgs.push('genre_in: $genres');
    baseVars.genres = genres;
  }
  if (formats.length > 0) {
    varDefs.push('$formats: [MediaFormat]');
    mediaArgs.push('format_in: $formats');
    baseVars.formats = formats;
  } else {
    // Default: hide shorts/ONAs unless the user explicitly asks for them.
    mediaArgs.push('format_not_in: [ONA, TV_SHORT]');
  }

  const query = `query (${varDefs.join(', ')}) {
    Page(page: $page, perPage: $perPage) {
      pageInfo { hasNextPage }
      media(${mediaArgs.join(', ')}) {
        ${ANIME_LIST_FIELDS}
      }
    }
  }`;

  const all: Anime[] = [];
  let page = 1;
  let hasNext = true;
  while (hasNext && page <= 20) {
    const data = await anilistQuery<AniListPageResponse>(query, {
      ...baseVars,
      page,
      perPage,
    });
    all.push(...data.Page.media.map(mapMedia));
    hasNext = data.Page.pageInfo.hasNextPage;
    page++;
  }

  // Studio filter is applied client-side over the season results (AniList's media
  // query has no studio argument). Matches the main animation studio.
  const studio = params.studio?.trim().toLowerCase();
  if (studio) {
    return all.filter((a) =>
      a.studios?.nodes?.some((n) => n.name.toLowerCase() === studio),
    );
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

/** Popular shows currently airing (no season filter) — used as a discovery fallback. */
export async function fetchAiringPopular(limit: number = 12): Promise<Anime[]> {
  const data = await anilistQuery<AniListPageResponse>(
    `query ($perPage: Int) {
      Page(page: 1, perPage: $perPage) {
        pageInfo { hasNextPage }
        media(sort: POPULARITY_DESC, type: ANIME, isAdult: false, status: RELEASING, format_not_in: [ONA, TV_SHORT]) {
          ${ANIME_LIST_FIELDS}
        }
      }
    }`,
    { perPage: limit },
  );
  return data.Page.media.map(mapMedia);
}

interface AniListRecsResponse {
  Page: {
    media: Array<{
      id: number;
      recommendations: {
        nodes: Array<{ rating: number | null; mediaRecommendation: AniListMediaItem | null }>;
      } | null;
    }>;
  };
}

/**
 * Aggregate AniList recommendations across a set of source titles (e.g. the
 * user's tracked list), ranked by summed recommendation rating, excluding
 * anything already in the source set. No score/rating is shown — pure "if you
 * liked these" discovery.
 */
export async function fetchRecommendationsForIds(
  ids: number[],
  limit: number = 12,
): Promise<Anime[]> {
  if (ids.length === 0) return [];
  const sample = ids.slice(0, 12); // cap source breadth to keep the query light
  try {
    const data = await anilistQuery<AniListRecsResponse>(
      `query ($ids: [Int]) {
        Page(page: 1, perPage: 50) {
          media(id_in: $ids, type: ANIME) {
            id
            recommendations(sort: RATING_DESC, perPage: 8) {
              nodes {
                rating
                mediaRecommendation { ${ANIME_LIST_FIELDS} }
              }
            }
          }
        }
      }`,
      { ids: sample },
    );

    const score = new Map<number, number>();
    const media = new Map<number, AniListMediaItem>();
    for (const m of data.Page.media) {
      for (const node of m.recommendations?.nodes ?? []) {
        const rec = node.mediaRecommendation;
        if (!rec) continue;
        score.set(rec.id, (score.get(rec.id) ?? 0) + (node.rating ?? 1));
        media.set(rec.id, rec);
      }
    }

    const exclude = new Set(ids);
    return [...media.values()]
      .filter((m) => !exclude.has(m.id))
      .sort((a, b) => (score.get(b.id) ?? 0) - (score.get(a.id) ?? 0))
      .slice(0, limit)
      .map(mapMedia);
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    return [];
  }
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

/**
 * Full search results (for the /search page). Uses AniList's `search:` argument
 * with SEARCH_MATCH sorting, which already does partial/fuzzy substring matching.
 */
export async function searchAnime(searchTerm: string, perPage: number = 30): Promise<Anime[]> {
  if (!searchTerm.trim()) return [];
  try {
    const data = await anilistQuery<AniListPageResponse>(
      `query ($search: String, $perPage: Int) {
        Page(page: 1, perPage: $perPage) {
          pageInfo { hasNextPage }
          media(search: $search, sort: SEARCH_MATCH, type: ANIME, isAdult: false) {
            ${ANIME_LIST_FIELDS}
          }
        }
      }`,
      { search: searchTerm.trim(), perPage },
    );
    return data.Page.media.map(mapMedia);
  } catch (error) {
    console.error('Error searching anime:', error);
    return [];
  }
}

/* ------------------------------------------------------------------ */
/*  Tracked media info (for profile cards + stats)                     */
/* ------------------------------------------------------------------ */

export interface TrackedMediaInfo {
  id: number;
  title: { romaji: string; english: string | null };
  cover: string | null;
  genres: string[];
  episodes: number | null;
  duration: number | null;
  format: string | null;
  seasonYear: number | null;
  studio: { id: number; name: string } | null;
}

interface TrackedMediaResponse {
  Page: {
    pageInfo: { hasNextPage: boolean };
    media: Array<{
      id: number;
      title: { romaji: string; english: string | null };
      coverImage: { large: string | null };
      genres: string[];
      episodes: number | null;
      duration: number | null;
      format: string | null;
      seasonYear: number | null;
      studios: { nodes: Array<{ id: number; name: string }> };
    }>;
  };
}

/** Batch-fetch media details for a set of ids (paginated), keyed by id. */
export async function fetchTrackedMediaInfo(
  ids: number[],
): Promise<Map<number, TrackedMediaInfo>> {
  const map = new Map<number, TrackedMediaInfo>();
  if (ids.length === 0) return map;

  let page = 1;
  let hasNext = true;
  while (hasNext && page <= 20) {
    const data = await anilistQuery<TrackedMediaResponse>(
      `query ($ids: [Int], $page: Int) {
        Page(page: $page, perPage: 50) {
          pageInfo { hasNextPage }
          media(id_in: $ids, type: ANIME) {
            id
            title { romaji english }
            coverImage { large }
            genres
            episodes
            duration
            format
            seasonYear
            studios(isMain: true) { nodes { id name } }
          }
        }
      }`,
      { ids, page },
    );
    for (const m of data.Page.media) {
      const st = m.studios?.nodes?.[0];
      map.set(m.id, {
        id: m.id,
        title: { romaji: m.title.romaji || 'Untitled', english: m.title.english },
        cover: m.coverImage?.large ?? null,
        genres: m.genres ?? [],
        episodes: m.episodes,
        duration: m.duration,
        format: m.format,
        seasonYear: m.seasonYear,
        studio: st ? { id: st.id, name: st.name } : null,
      });
    }
    hasNext = data.Page.pageInfo.hasNextPage;
    page++;
  }
  return map;
}

/* ------------------------------------------------------------------ */
/*  AniList list import                                                 */
/* ------------------------------------------------------------------ */

export interface ImportEntry {
  animeId: number;
  status: string;
  progress: number;
  totalEpisodes: number | null;
}

const AL_STATUS_MAP: Record<string, string> = {
  CURRENT: 'watching',
  REPEATING: 'watching',
  PLANNING: 'planning',
  COMPLETED: 'completed',
  DROPPED: 'dropped',
  PAUSED: 'paused',
};

interface MediaListCollectionResponse {
  MediaListCollection: {
    lists: Array<{
      entries: Array<{
        status: string;
        progress: number | null;
        media: { id: number; episodes: number | null };
      }>;
    }>;
  } | null;
}

/** Fetch a public AniList user's anime list, mapped to ANNIE's tracking shape. */
export async function fetchAniListUserList(userName: string): Promise<ImportEntry[]> {
  const data = await anilistQuery<MediaListCollectionResponse>(
    `query ($userName: String) {
      MediaListCollection(userName: $userName, type: ANIME) {
        lists {
          entries {
            status
            progress
            media { id episodes }
          }
        }
      }
    }`,
    { userName },
    { cache: 'no-store' },
  );

  const coll = data.MediaListCollection;
  if (!coll) return [];

  const byId = new Map<number, ImportEntry>();
  for (const list of coll.lists ?? []) {
    for (const e of list.entries ?? []) {
      const status = AL_STATUS_MAP[e.status];
      if (!status || byId.has(e.media.id)) continue;
      byId.set(e.media.id, {
        animeId: e.media.id,
        status,
        progress: e.progress ?? 0,
        totalEpisodes: e.media.episodes ?? null,
      });
    }
  }
  return [...byId.values()];
}

/* ------------------------------------------------------------------ */
/*  Multi-entity search (characters / staff / studios)                 */
/* ------------------------------------------------------------------ */

export interface EntityHit {
  id: number;
  name: string;
  image: string | null;
}

export interface EntityResults {
  characters: EntityHit[];
  staff: EntityHit[];
  studios: EntityHit[];
}

interface EntitySearchResponse {
  characters: { characters: Array<{ id: number; name: { full: string }; image: { large: string | null } }> };
  staff: { staff: Array<{ id: number; name: { full: string }; image: { large: string | null } }> };
  studios: { studios: Array<{ id: number; name: string }> };
}

export async function searchEntities(searchTerm: string): Promise<EntityResults> {
  const empty: EntityResults = { characters: [], staff: [], studios: [] };
  if (!searchTerm.trim()) return empty;
  try {
    const data = await anilistQuery<EntitySearchResponse>(
      `query ($q: String) {
        characters: Page(page: 1, perPage: 12) {
          characters(search: $q, sort: SEARCH_MATCH) { id name { full } image { large } }
        }
        staff: Page(page: 1, perPage: 12) {
          staff(search: $q, sort: SEARCH_MATCH) { id name { full } image { large } }
        }
        studios: Page(page: 1, perPage: 8) {
          studios(search: $q) { id name }
        }
      }`,
      { q: searchTerm.trim() },
    );
    return {
      characters: data.characters.characters.map((c) => ({
        id: c.id,
        name: c.name.full,
        image: c.image?.large ?? null,
      })),
      staff: data.staff.staff.map((s) => ({
        id: s.id,
        name: s.name.full,
        image: s.image?.large ?? null,
      })),
      studios: data.studios.studios.map((s) => ({ id: s.id, name: s.name, image: null })),
    };
  } catch {
    return empty;
  }
}

interface StudioSearchResponse {
  Page: { studios: Array<{ id: number; name: string }> };
}

/** Type-ahead studio search for the Browse filter. */
export async function searchStudios(searchTerm: string): Promise<{ id: number; name: string }[]> {
  if (!searchTerm.trim()) return [];
  try {
    const data = await anilistQuery<StudioSearchResponse>(
      `query ($q: String) {
        Page(page: 1, perPage: 8) {
          studios(search: $q) { id name }
        }
      }`,
      { q: searchTerm.trim() },
    );
    return data.Page.studios.map((s) => ({ id: s.id, name: s.name }));
  } catch {
    return [];
  }
}

interface MalResolveResponse {
  Page: {
    pageInfo: { hasNextPage: boolean };
    media: Array<{ id: number; idMal: number | null; episodes: number | null }>;
  };
}

/** Map MyAnimeList ids -> AniList ids (+ episode counts), paginated. */
export async function resolveMalIds(
  malIds: number[],
): Promise<Map<number, { id: number; episodes: number | null }>> {
  const map = new Map<number, { id: number; episodes: number | null }>();
  if (malIds.length === 0) return map;

  // AniList caps id_in lists; chunk to 50 ids per query.
  for (let i = 0; i < malIds.length; i += 50) {
    const chunk = malIds.slice(i, i + 50);
    let page = 1;
    let hasNext = true;
    while (hasNext && page <= 10) {
      try {
        const data = await anilistQuery<MalResolveResponse>(
          `query ($ids: [Int], $page: Int) {
            Page(page: $page, perPage: 50) {
              pageInfo { hasNextPage }
              media(idMal_in: $ids, type: ANIME) { id idMal episodes }
            }
          }`,
          { ids: chunk, page },
        );
        for (const m of data.Page.media) {
          if (m.idMal != null) map.set(m.idMal, { id: m.id, episodes: m.episodes });
        }
        hasNext = data.Page.pageInfo.hasNextPage;
        page += 1;
      } catch {
        break;
      }
    }
  }
  return map;
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
