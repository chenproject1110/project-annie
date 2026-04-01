// AniList GraphQL API Client

import type { MinimalAnime } from '@/types/anime';

export type Season = 'WINTER' | 'SPRING' | 'SUMMER' | 'FALL';
export type MediaFormat = 'TV' | 'TV_SHORT' | 'MOVIE' | 'SPECIAL' | 'OVA' | 'ONA' | 'MUSIC';
export type MediaSource = 'ORIGINAL' | 'MANGA' | 'LIGHT_NOVEL' | 'VISUAL_NOVEL' | 'VIDEO_GAME' | 'OTHER' | 'NOVEL' | 'DOUJINSHI' | 'ANIME' | 'WEB_NOVEL' | 'LIVE_ACTION' | 'GAME' | 'COMIC' | 'MULTIMEDIA_PROJECT' | 'PICTURE_BOOK';
export type RelationType = 'ADAPTATION' | 'PREQUEL' | 'SEQUEL' | 'PARENT' | 'SIDE_STORY' | 'CHARACTER' | 'SUMMARY' | 'ALTERNATIVE' | 'SPIN_OFF' | 'OTHER' | 'SOURCE' | 'COMPILATION' | 'CONTAINS';

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
  id: number;
  title: AnimeTitle;
  coverImage: CoverImage;
  description: string | null;
  genres: string[];
  episodes: number | null;
  studios: Studio;
  status: AnimeStatus;
  startDate: StartDate;
}

// Detailed Anime interfaces for single anime page
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
    id: number;
    name: CharacterName;
    image: CharacterImage;
  };
  role: string;
  voiceActors: VoiceActor[];
}

export interface RelationNode {
  id: number;
  title: AnimeTitle;
  coverImage: CoverImage;
  format: MediaFormat;
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
  id: number;
  idMal: number | null;
  title: AnimeTitle;
  coverImage: CoverImage;
  bannerImage: string | null;
  description: string | null;
  format: MediaFormat;
  episodes: number | null;
  duration: number | null;
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
}

interface PageInfo {
  hasNextPage: boolean;
  currentPage: number;
}

interface AnimeResponse {
  data: {
    Page: {
      pageInfo: PageInfo;
      media: Anime[];
    };
  };
}

const ANILIST_API_URL = 'https://graphql.anilist.co';

// Lightweight query for search suggestions
const SEARCH_SUGGESTIONS_QUERY = `
query ($search: String, $perPage: Int) {
  Page(page: 1, perPage: $perPage) {
    media(search: $search, type: ANIME, sort: [SEARCH_MATCH, POPULARITY_DESC], countryOfOrigin: "JP") {
      id
      title {
        romaji
        english
      }
      coverImage {
        medium
      }
      format
      startDate {
        year
      }
    }
  }
}
`;

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

interface SearchSuggestionsResponse {
  data: {
    Page: {
      media: SearchSuggestion[];
    };
  };
}

const ANIME_QUERY = `
query ($season: MediaSeason, $year: Int, $page: Int, $perPage: Int, $search: String, $sort: [MediaSort], $countryOfOrigin: CountryCode) {
  Page(page: $page, perPage: $perPage) {
    pageInfo {
      hasNextPage
      currentPage
    }
    media(season: $season, seasonYear: $year, type: ANIME, sort: $sort, search: $search, countryOfOrigin: $countryOfOrigin) {
      id
      title {
        english
        romaji
      }
      coverImage {
        extraLarge
      }
      description
      genres
      episodes
      studios {
        nodes {
          name
        }
      }
      status
      startDate {
        year
        month
        day
      }
    }
  }
}
`;

export interface FetchAnimeParams {
  season?: Season;
  year?: number;
  search?: string;
}

/**
 * Fetches a single page of anime data from AniList API
 */
async function fetchAnimePage(
  params: { season?: Season; year?: number; search?: string },
  page: number,
  perPage: number = 50
): Promise<{ media: Anime[]; hasNextPage: boolean }> {
  // Determine sort order: SEARCH_MATCH for search, POPULARITY_DESC for browsing
  const sort = params.search ? ['SEARCH_MATCH', 'POPULARITY_DESC'] : ['POPULARITY_DESC'];
  
  const response = await fetch(ANILIST_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      query: ANIME_QUERY,
      variables: {
        season: params.season || null,
        year: params.year || null,
        search: params.search || null,
        sort,
        countryOfOrigin: 'JP', // Filter for Japanese anime only
        page,
        perPage,
      },
    }),
    next: {
      revalidate: 3600, // Cache for 1 hour
    },
  });

  if (!response.ok) {
    throw new Error(`AniList API error: ${response.status}`);
  }

  const json: AnimeResponse = await response.json();
  return {
    media: json.data.Page.media,
    hasNextPage: json.data.Page.pageInfo.hasNextPage,
  };
}

/**
 * Fetches ALL anime data from AniList API
 * Automatically handles pagination to retrieve all results
 * Filters out Hentai content
 * @param params - Season/year or search term
 * @returns Array of all anime matching criteria (excluding Hentai)
 */
export async function fetchAnime(params: FetchAnimeParams): Promise<Anime[]> {
  try {
    const allAnime: Anime[] = [];
    let currentPage = 1;
    let hasNextPage = true;

    // If search is provided, set season/year to undefined to search entire database
    const searchParams = params.search 
      ? { search: params.search, season: undefined, year: undefined }
      : { season: params.season, year: params.year, search: undefined };

    // Fetch all pages until there are no more results
    while (hasNextPage) {
      const { media, hasNextPage: hasMore } = await fetchAnimePage(
        searchParams,
        currentPage,
        50 // Fetch 50 per page (AniList API limit)
      );

      allAnime.push(...media);
      hasNextPage = hasMore;
      currentPage++;

      // Optional: Add a small delay to avoid rate limiting (if needed)
      if (hasNextPage) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Filter out Hentai content
    const filteredAnime = allAnime.filter(anime => 
      !anime.genres.includes('Hentai')
    );

    const desc = params.search 
      ? `search: "${params.search}"` 
      : `${params.season} ${params.year}`;
    console.log(`Fetched ${filteredAnime.length} anime for ${desc} (filtered from ${allAnime.length} total)`);
    return filteredAnime;
  } catch (error) {
    console.error('Error fetching anime:', error);
    throw error;
  }
}

const TRENDING_HERO_QUERY = `
query ($perPage: Int) {
  Page(page: 1, perPage: $perPage) {
    media(type: ANIME, sort: TRENDING_DESC, countryOfOrigin: JP) {
      id
      bannerImage
      title {
        english
        romaji
      }
      coverImage {
        extraLarge
      }
      description
      genres
      episodes
      studios {
        nodes {
          name
        }
      }
      status
      startDate {
        year
        month
        day
      }
    }
  }
}
`;

export interface TrendingHeroAnime {
  id: number;
  bannerImage: string | null;
  title: AnimeTitle;
  coverImage: CoverImage;
  description: string | null;
  genres: string[];
  episodes: number | null;
  studios: Studio;
  status: AnimeStatus;
  startDate: StartDate;
}

interface TrendingHeroResponse {
  data: {
    Page: {
      media: TrendingHeroAnime[];
    };
  };
}

/**
 * Current broadcast season + year for AniList queries (WINTER after December uses the following calendar year).
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

const SEASON_TRENDING_HERO_QUERY = `
query ($season: MediaSeason, $year: Int, $perPage: Int) {
  Page(page: 1, perPage: $perPage) {
    media(
      type: ANIME
      season: $season
      seasonYear: $year
      sort: TRENDING_DESC
      countryOfOrigin: JP
    ) {
      id
      bannerImage
      title {
        english
        romaji
      }
      coverImage {
        extraLarge
      }
      description
      genres
      episodes
      studios {
        nodes {
          name
        }
      }
      status
      startDate {
        year
        month
        day
      }
    }
  }
}
`;

interface SeasonTrendingHeroResponse {
  data: {
    Page: {
      media: TrendingHeroAnime[];
    };
  };
}

/**
 * Top trending anime for a given season (e.g. current season hero). Same shape as global trending hero.
 */
export async function fetchSeasonTrendingHero(
  season: Season,
  year: number,
  limit: number = 6
): Promise<TrendingHeroAnime[]> {
  const response = await fetch(ANILIST_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      query: SEASON_TRENDING_HERO_QUERY,
      variables: { season, year, perPage: limit },
    }),
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new Error(`AniList API error: ${response.status}`);
  }

  const json: SeasonTrendingHeroResponse = await response.json();
  return json.data.Page.media.filter((m) => !m.genres.includes('Hentai'));
}

/**
 * Top trending titles for the home hero carousel.
 * GraphQL includes `bannerImage` (wide art) and `coverImage.extraLarge` (poster fallback).
 */
export async function fetchTrendingHero(perPage: number = 8): Promise<TrendingHeroAnime[]> {
  const response = await fetch(ANILIST_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      query: TRENDING_HERO_QUERY,
      variables: { perPage },
    }),
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new Error(`AniList API error: ${response.status}`);
  }

  const json: TrendingHeroResponse = await response.json();
  return json.data.Page.media.filter((m) => !m.genres.includes('Hentai'));
}

/**
 * First page of a season (by popularity), optionally prioritizing certain statuses — for home previews without full pagination.
 */
export async function fetchSeasonAnimeLimited(
  season: Season,
  year: number,
  options?: { limit?: number; preferStatus?: AnimeStatus[] }
): Promise<Anime[]> {
  const limit = options?.limit ?? 6;
  const { media } = await fetchAnimePage({ season, year }, 1, 50);
  let list = media.filter((a) => !a.genres.includes('Hentai'));
  const prefer = options?.preferStatus;
  if (prefer && prefer.length > 0) {
    const preferred = list.filter((a) => prefer.includes(a.status));
    const other = list.filter((a) => !prefer.includes(a.status));
    list = [...preferred, ...other];
  }
  return list.slice(0, limit);
}

/**
 * Get the primary studio name for an anime
 */
export function getPrimaryStudio(anime: Pick<Anime, 'studios'>): string {
  if (anime.studios?.nodes && anime.studios.nodes.length > 0) {
    return anime.studios.nodes[0].name;
  }
  return 'Unknown Studio';
}

/**
 * Get the display title (prefer English, fallback to Romaji)
 */
export function getDisplayTitle(anime: MinimalAnime): string {
  return anime.title.english || anime.title.romaji;
}

/**
 * Fetch search suggestions for autocomplete (lightweight, fast)
 * @param searchTerm - Search query
 * @param limit - Number of suggestions (default 5)
 * @returns Array of minimal anime data for suggestions
 */
export async function fetchSearchSuggestions(searchTerm: string, limit: number = 5): Promise<SearchSuggestion[]> {
  if (!searchTerm.trim()) return [];

  try {
    const response = await fetch(ANILIST_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        query: SEARCH_SUGGESTIONS_QUERY,
        variables: {
          search: searchTerm.trim(),
          perPage: limit,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`AniList API error: ${response.status}`);
    }

    const json: SearchSuggestionsResponse = await response.json();
    return json.data.Page.media;
  } catch (error) {
    console.error('Error fetching search suggestions:', error);
    return [];
  }
}

/**
 * Strip HTML tags from description
 */
export function stripHtml(html: string | null): string {
  if (!html) return 'No description available.';
  return html.replace(/<[^>]*>/g, '');
}

/**
 * Map AniList status to display label
 */
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

/**
 * Format date to GMT+8 (Asia/Kuala_Lumpur)
 */
export function formatDateGMT8(startDate: StartDate): string {
  const { year, month, day } = startDate;
  
  if (!year) return 'TBA';
  
  // Create date object (month is 0-indexed in JS Date)
  const date = new Date(year, (month || 1) - 1, day || 1);
  
  // Format to GMT+8 timezone
  const formatter = new Intl.DateTimeFormat('en-MY', {
    timeZone: 'Asia/Kuala_Lumpur',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  
  return formatter.format(date);
}

/**
 * Get release label based on status
 */
export function getReleaseLabel(status: AnimeStatus): string {
  return status === 'NOT_YET_RELEASED' ? 'Releasing on' : 'Released on';
}
