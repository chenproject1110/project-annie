// AniList GraphQL API for Detailed Single Anime

import { AnimeDetail } from './anilist';

const ANILIST_API_URL = 'https://graphql.anilist.co';

const ANIME_DETAIL_QUERY = `
query ($id: Int) {
  Media(id: $id, type: ANIME) {
    id
    idMal
    title {
      romaji
      english
      native
    }
    coverImage {
      extraLarge
    }
    bannerImage
    description
    format
    episodes
    duration
    status
    season
    seasonYear
    source
    startDate {
      year
      month
      day
    }
    endDate {
      year
      month
      day
    }
    genres
    studios {
      nodes {
        name
        isAnimationStudio
      }
    }
    relations {
      edges {
        relationType
        node {
          id
          title {
            romaji
            english
            native
          }
          coverImage {
            extraLarge
          }
          format
        }
      }
    }
    characters(sort: ROLE, perPage: 12) {
      edges {
        role
        node {
          id
          name {
            full
            native
          }
          image {
            large
          }
        }
        voiceActors(language: JAPANESE) {
          name {
            full
            native
          }
          image {
            large
          }
          language
        }
      }
    }
    externalLinks {
      site
      url
      icon
    }
    nextAiringEpisode {
      airingAt
      timeUntilAiring
      episode
    }
  }
}
`;

interface AnimeDetailResponse {
  data: {
    Media: AnimeDetail;
  };
}

/**
 * Fetch detailed anime data by ID
 */
export async function fetchAnimeDetail(id: number): Promise<AnimeDetail> {
  try {
    const response = await fetch(ANILIST_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        query: ANIME_DETAIL_QUERY,
        variables: { id },
      }),
      next: {
        revalidate: 3600, // Cache for 1 hour
      },
    });

    if (!response.ok) {
      throw new Error(`AniList API error: ${response.status}`);
    }

    const json: AnimeDetailResponse = await response.json();
    return json.data.Media;
  } catch (error) {
    console.error('Error fetching anime detail:', error);
    throw error;
  }
}

/**
 * Format date to JST (Japan Standard Time)
 */
export function formatDateJST(date: { year: number | null; month: number | null; day: number | null }): string {
  const { year, month, day } = date;
  
  if (!year) return 'TBA';
  
  // Create date object (month is 0-indexed in JS Date)
  const dateObj = new Date(year, (month || 1) - 1, day || 1);
  
  // Format to JST timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  
  return formatter.format(dateObj);
}

/**
 * Filter external links to only show Official Site, Twitter, and YouTube
 */
export function filterExternalLinks(links: Array<{ site: string; url: string; icon: string | null }>) {
  const allowedSites = ['Official Site', 'Twitter', 'YouTube'];
  return links.filter(link => 
    allowedSites.some(allowed => link.site.includes(allowed))
  );
}

/**
 * Format media format for display
 */
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

/**
 * Format media source for display
 */
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

/**
 * Format relation type for display
 */
export function formatRelationType(type: string): string {
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
  return typeMap[type] || type;
}

/**
 * Format broadcast schedule from nextAiringEpisode
 * Returns format like "Wednesdays at 23:00 (JST)"
 */
export function formatBroadcastSchedule(airingAt: number): string {
  // Convert Unix timestamp to Date in JST timezone
  const date = new Date(airingAt * 1000);
  
  // Get day of week in JST
  const dayFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Tokyo',
    weekday: 'long',
  });
  const dayOfWeek = dayFormatter.format(date);
  
  // Get time in JST (24-hour format)
  const timeFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Tokyo',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const time = timeFormatter.format(date);
  
  return `${dayOfWeek}s at ${time} (JST)`;
}

/**
 * Format time until next episode airs
 * Returns format like "Episode 5 in 2 days"
 */
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
