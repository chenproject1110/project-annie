// AniList GraphQL API — detailed anime + shared formatters

import { cache } from 'react';
import type {
  AnimeDetail,
  Character,
  MediaFormat,
  Relation,
  RelationType,
  VoiceActor,
} from './anilist';
import { anilistQuery } from './anilist';

/* ------------------------------------------------------------------ */
/*  GraphQL query                                                      */
/* ------------------------------------------------------------------ */

const DETAIL_QUERY = `
  query ($id: Int) {
    Media(id: $id, type: ANIME) {
      id
      idMal
      title { romaji english native }
      coverImage { extraLarge large color }
      bannerImage
      description
      format
      episodes
      duration
      status
      season
      seasonYear
      source
      startDate { year month day }
      endDate { year month day }
      genres
      studios { nodes { name isAnimationStudio } }
      relations {
        edges {
          relationType
          node {
            id
            title { romaji english native }
            coverImage { extraLarge large }
            format
            type
          }
        }
      }
      characters(sort: [ROLE, RELEVANCE], perPage: 25) {
        edges {
          role
          node {
            id
            name { full native }
            image { large }
          }
          voiceActors {
            id
            name { full native }
            image { large }
            languageV2
          }
        }
      }
      externalLinks { site url icon }
      nextAiringEpisode { airingAt timeUntilAiring episode }
    }
  }
`;

/* ------------------------------------------------------------------ */
/*  Response types (private)                                           */
/* ------------------------------------------------------------------ */

interface AniListDetailResponse {
  Media: {
    id: number;
    idMal: number | null;
    title: { romaji: string; english: string | null; native: string | null };
    coverImage: { extraLarge: string; large: string | null; color: string | null };
    bannerImage: string | null;
    description: string | null;
    format: string | null;
    episodes: number | null;
    duration: number | null;
    status: string;
    season: string | null;
    seasonYear: number | null;
    source: string | null;
    startDate: { year: number | null; month: number | null; day: number | null };
    endDate: { year: number | null; month: number | null; day: number | null };
    genres: string[];
    studios: {
      nodes: Array<{ name: string; isAnimationStudio: boolean }>;
    };
    relations: {
      edges: Array<{
        relationType: string;
        node: {
          id: number;
          title: { romaji: string; english: string | null; native: string | null };
          coverImage: { extraLarge: string; large: string | null };
          format: string | null;
          type: string;
        };
      }>;
    };
    characters: {
      edges: Array<{
        role: string;
        node: {
          id: number;
          name: { full: string; native: string | null };
          image: { large: string };
        };
        voiceActors: Array<{
          id: number;
          name: { full: string; native: string | null };
          image: { large: string };
          languageV2: string;
        }>;
      }>;
    };
    externalLinks: Array<{ site: string; url: string; icon: string | null }>;
    nextAiringEpisode: {
      airingAt: number;
      timeUntilAiring: number;
      episode: number;
    } | null;
  };
}

/* ------------------------------------------------------------------ */
/*  Fetcher                                                            */
/* ------------------------------------------------------------------ */

async function fetchAnimeDetailUncached(id: number): Promise<AnimeDetail> {
  const data = await anilistQuery<AniListDetailResponse>(DETAIL_QUERY, { id });
  const m = data.Media;

  const animeRelationEdges: Relation[] = (m.relations?.edges ?? [])
    .filter((e) => e.node.type === 'ANIME')
    .map((e) => ({
      relationType: e.relationType as RelationType,
      node: {
        id: e.node.id,
        title: {
          english: e.node.title.english || null,
          romaji: e.node.title.romaji || 'Untitled',
          native: e.node.title.native || null,
        },
        coverImage: {
          extraLarge: e.node.coverImage?.extraLarge || '',
          large: e.node.coverImage?.large,
        },
        format: (e.node.format as MediaFormat) || null,
      },
    }));

  const characterEdges: Character[] = (m.characters?.edges ?? []).map((e) => {
    const japaneseVAs = (e.voiceActors ?? []).filter(
      (va) => va.languageV2 === 'Japanese',
    );
    const va = japaneseVAs[0];
    const voiceActors: VoiceActor[] = va
      ? [
          {
            name: { full: va.name.full, native: va.name.native },
            image: { large: va.image?.large || '' },
            language: 'Japanese',
          },
        ]
      : [];
    return {
      role: e.role,
      node: {
        id: e.node.id,
        name: { full: e.node.name.full, native: e.node.name.native },
        image: { large: e.node.image?.large || '' },
      },
      voiceActors,
    };
  });

  const durationMin = m.duration;
  const durationStr = durationMin ? `${durationMin} min` : null;

  let broadcastSchedule: string | null = null;
  if (m.nextAiringEpisode) {
    broadcastSchedule = formatBroadcastSchedule(m.nextAiringEpisode.airingAt);
  }

  return {
    id: m.id,
    idMal: m.idMal,
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
    description: m.description,
    format: (m.format as MediaFormat) || 'TV',
    episodes: m.episodes,
    duration: durationStr,
    status: (m.status as AnimeDetail['status']) || 'FINISHED',
    season: (m.season as AnimeDetail['season']) || null,
    seasonYear: m.seasonYear,
    source: (m.source as AnimeDetail['source']) || null,
    startDate: m.startDate || { year: null, month: null, day: null },
    endDate: m.endDate || { year: null, month: null, day: null },
    genres: m.genres || [],
    studios: {
      nodes: (m.studios?.nodes ?? []).map((s) => ({
        name: s.name,
        isAnimationStudio: s.isAnimationStudio,
      })),
    },
    relations: { edges: animeRelationEdges },
    characters: { edges: characterEdges },
    externalLinks: (m.externalLinks ?? []).map((l) => ({
      site: l.site,
      url: l.url,
      icon: l.icon,
    })),
    nextAiringEpisode: m.nextAiringEpisode,
    broadcastSchedule,
  };
}

/**
 * Per-request dedupe: `generateMetadata` and the page both call this; only one
 * AniList query runs per render.
 */
export const fetchAnimeDetail = cache(fetchAnimeDetailUncached);

/* ------------------------------------------------------------------ */
/*  Formatters (pure — no API dependency)                              */
/* ------------------------------------------------------------------ */

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

export function filterExternalLinks(
  links: Array<{ site: string; url: string; icon: string | null }>,
) {
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
