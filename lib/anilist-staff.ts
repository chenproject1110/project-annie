// AniList Staff (voice actors) — detail + voiced works

import { cache } from 'react';
import { anilistQuery, stripHtml } from './anilist';

export interface StaffWork {
  mediaId: number;
  title: { romaji: string; english: string | null };
  cover: string;
  year: number | null;
  format: string | null;
  characterName: string | null;
  characterImage: string | null;
  role: string | null;
}

export interface StaffDetail {
  id: number;
  name: { full: string; native: string | null };
  image: string | null;
  description: string | null;
  language: string | null;
  occupations: string[];
  works: StaffWork[];
}

// AniList caps `characterMedia` at 25 edges per page, so we page through it.
const PER_PAGE = 25;
const MAX_PAGES = 16; // up to 400 roles — covers even very prolific actors

const CHARACTER_MEDIA_FIELDS = `
  pageInfo { hasNextPage currentPage }
  edges {
    characterRole
    characters { id name { full } image { large } }
    node {
      id
      type
      format
      title { romaji english }
      coverImage { extraLarge large }
      startDate { year }
    }
  }
`;

const STAFF_QUERY = `
  query ($id: Int, $page: Int) {
    Staff(id: $id) {
      id
      name { full native }
      image { large }
      description(asHtml: false)
      languageV2
      primaryOccupations
      characterMedia(sort: START_DATE_DESC, page: $page, perPage: ${PER_PAGE}) {
        ${CHARACTER_MEDIA_FIELDS}
      }
    }
  }
`;

const STAFF_MEDIA_PAGE_QUERY = `
  query ($id: Int, $page: Int) {
    Staff(id: $id) {
      characterMedia(sort: START_DATE_DESC, page: $page, perPage: ${PER_PAGE}) {
        ${CHARACTER_MEDIA_FIELDS}
      }
    }
  }
`;

interface CharacterMediaEdge {
  characterRole: string | null;
  characters: Array<{
    id: number;
    name: { full: string };
    image: { large: string | null };
  }>;
  node: {
    id: number;
    type: string;
    format: string | null;
    title: { romaji: string; english: string | null };
    coverImage: { extraLarge: string | null; large: string | null };
    startDate: { year: number | null };
  };
}

interface CharacterMediaConn {
  pageInfo: { hasNextPage: boolean; currentPage: number };
  edges: CharacterMediaEdge[];
}

interface StaffResponse {
  Staff: {
    id: number;
    name: { full: string; native: string | null };
    image: { large: string | null } | null;
    description: string | null;
    languageV2: string | null;
    primaryOccupations: string[] | null;
    characterMedia: CharacterMediaConn | null;
  } | null;
}

interface StaffMediaPageResponse {
  Staff: { characterMedia: CharacterMediaConn | null } | null;
}

/** AniList bios are markdown-ish; turn [label](url) into label and drop stray links. */
function cleanDescription(raw: string): string {
  return stripHtml(raw)
    .replace(/\[([^\]]+)\]\((?:https?:)?\/\/[^)]+\)/g, '$1')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function fetchStaffDetailUncached(id: number): Promise<StaffDetail> {
  const first = await anilistQuery<StaffResponse>(STAFF_QUERY, { id, page: 1 });
  const s = first.Staff;
  if (!s) throw new Error('Staff not found');

  let edges: CharacterMediaEdge[] = s.characterMedia?.edges ?? [];
  let hasNext = s.characterMedia?.pageInfo?.hasNextPage ?? false;
  let page = 1;

  while (hasNext && page < MAX_PAGES) {
    page += 1;
    try {
      const next = await anilistQuery<StaffMediaPageResponse>(STAFF_MEDIA_PAGE_QUERY, {
        id,
        page,
      });
      const conn = next.Staff?.characterMedia;
      if (!conn) break;
      edges = edges.concat(conn.edges);
      hasNext = conn.pageInfo?.hasNextPage ?? false;
    } catch {
      break; // keep whatever we've collected so far
    }
  }

  const works: StaffWork[] = edges
    .filter((e) => e.node.type === 'ANIME')
    .map((e) => {
      const ch = e.characters?.[0];
      return {
        mediaId: e.node.id,
        title: {
          romaji: e.node.title.romaji || 'Untitled',
          english: e.node.title.english,
        },
        cover: e.node.coverImage?.extraLarge || e.node.coverImage?.large || '',
        year: e.node.startDate?.year ?? null,
        format: e.node.format,
        characterName: ch?.name.full ?? null,
        characterImage: ch?.image?.large ?? null,
        role: e.characterRole,
      };
    })
    // Newest first; titles with no start date (upcoming/TBA) float to the top.
    .sort((a, b) => (b.year ?? 9999) - (a.year ?? 9999));

  return {
    id: s.id,
    name: { full: s.name.full, native: s.name.native },
    image: s.image?.large ?? null,
    description: s.description ? cleanDescription(s.description) : null,
    language: s.languageV2,
    occupations: s.primaryOccupations ?? [],
    works,
  };
}

/** Per-request dedupe between generateMetadata and the page. */
export const fetchStaffDetail = cache(fetchStaffDetailUncached);
