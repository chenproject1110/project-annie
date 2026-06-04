// AniList Studio — name + the studio's anime (main works), newest first

import { cache } from 'react';
import { anilistQuery } from './anilist';

export interface StudioWork {
  mediaId: number;
  title: { romaji: string; english: string | null };
  cover: string;
  year: number | null;
  format: string | null;
  episodes: number | null;
}

export interface StudioDetail {
  id: number;
  name: string;
  works: StudioWork[];
}

const PER_PAGE = 25;
const MAX_PAGES = 12;

const MEDIA_FIELDS = `
  pageInfo { hasNextPage currentPage }
  nodes {
    id
    type
    format
    episodes
    title { romaji english }
    coverImage { extraLarge large }
    startDate { year }
  }
`;

const STUDIO_QUERY = `
  query ($id: Int, $page: Int) {
    Studio(id: $id) {
      id
      name
      media(sort: START_DATE_DESC, page: $page, perPage: ${PER_PAGE}, isMain: true) {
        ${MEDIA_FIELDS}
      }
    }
  }
`;

const STUDIO_MEDIA_PAGE_QUERY = `
  query ($id: Int, $page: Int) {
    Studio(id: $id) {
      media(sort: START_DATE_DESC, page: $page, perPage: ${PER_PAGE}, isMain: true) {
        ${MEDIA_FIELDS}
      }
    }
  }
`;

interface MediaNode {
  id: number;
  type: string;
  format: string | null;
  episodes: number | null;
  title: { romaji: string; english: string | null };
  coverImage: { extraLarge: string | null; large: string | null };
  startDate: { year: number | null };
}

interface MediaConn {
  pageInfo: { hasNextPage: boolean; currentPage: number };
  nodes: MediaNode[];
}

interface StudioResponse {
  Studio: { id: number; name: string; media: MediaConn | null } | null;
}

interface StudioMediaPageResponse {
  Studio: { media: MediaConn | null } | null;
}

async function fetchStudioDetailUncached(id: number): Promise<StudioDetail> {
  const first = await anilistQuery<StudioResponse>(STUDIO_QUERY, { id, page: 1 });
  const s = first.Studio;
  if (!s) throw new Error('Studio not found');

  let nodes: MediaNode[] = s.media?.nodes ?? [];
  let hasNext = s.media?.pageInfo?.hasNextPage ?? false;
  let page = 1;

  while (hasNext && page < MAX_PAGES) {
    page += 1;
    try {
      const next = await anilistQuery<StudioMediaPageResponse>(STUDIO_MEDIA_PAGE_QUERY, { id, page });
      const conn = next.Studio?.media;
      if (!conn) break;
      nodes = nodes.concat(conn.nodes);
      hasNext = conn.pageInfo?.hasNextPage ?? false;
    } catch {
      break;
    }
  }

  // Dedupe (a studio can list the same title across cours) and keep anime only.
  const seen = new Set<number>();
  const works: StudioWork[] = [];
  for (const n of nodes) {
    if (n.type !== 'ANIME' || seen.has(n.id)) continue;
    seen.add(n.id);
    works.push({
      mediaId: n.id,
      title: { romaji: n.title.romaji || 'Untitled', english: n.title.english },
      cover: n.coverImage?.extraLarge || n.coverImage?.large || '',
      year: n.startDate?.year ?? null,
      format: n.format,
      episodes: n.episodes,
    });
  }
  works.sort((a, b) => (b.year ?? 9999) - (a.year ?? 9999));

  return { id: s.id, name: s.name, works };
}

export const fetchStudioDetail = cache(fetchStudioDetailUncached);
