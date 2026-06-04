// AniList Character — detail + appearances (with the JP voice actor per title)

import { cache } from 'react';
import { anilistQuery, stripHtml } from './anilist';

export interface CharacterWork {
  mediaId: number;
  title: { romaji: string; english: string | null };
  cover: string;
  year: number | null;
  format: string | null;
  role: string | null;
  vaId: number | null;
  vaName: string | null;
  vaImage: string | null;
}

export interface CharacterDetail {
  id: number;
  name: { full: string; native: string | null };
  image: string | null;
  description: string | null;
  gender: string | null;
  age: string | null;
  works: CharacterWork[];
}

const PER_PAGE = 25;
const MAX_PAGES = 12;

const MEDIA_FIELDS = `
  pageInfo { hasNextPage currentPage }
  edges {
    characterRole
    voiceActors(language: JAPANESE) { id name { full } image { large } }
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

const CHARACTER_QUERY = `
  query ($id: Int, $page: Int) {
    Character(id: $id) {
      id
      name { full native }
      image { large }
      description(asHtml: false)
      gender
      age
      media(sort: START_DATE_DESC, page: $page, perPage: ${PER_PAGE}) {
        ${MEDIA_FIELDS}
      }
    }
  }
`;

const CHARACTER_MEDIA_PAGE_QUERY = `
  query ($id: Int, $page: Int) {
    Character(id: $id) {
      media(sort: START_DATE_DESC, page: $page, perPage: ${PER_PAGE}) {
        ${MEDIA_FIELDS}
      }
    }
  }
`;

interface MediaEdge {
  characterRole: string | null;
  voiceActors: Array<{ id: number; name: { full: string }; image: { large: string | null } }>;
  node: {
    id: number;
    type: string;
    format: string | null;
    title: { romaji: string; english: string | null };
    coverImage: { extraLarge: string | null; large: string | null };
    startDate: { year: number | null };
  };
}

interface MediaConn {
  pageInfo: { hasNextPage: boolean; currentPage: number };
  edges: MediaEdge[];
}

interface CharacterResponse {
  Character: {
    id: number;
    name: { full: string; native: string | null };
    image: { large: string | null } | null;
    description: string | null;
    gender: string | null;
    age: string | null;
    media: MediaConn | null;
  } | null;
}

interface CharacterMediaPageResponse {
  Character: { media: MediaConn | null } | null;
}

function cleanDescription(raw: string): string {
  return stripHtml(raw)
    .replace(/\[([^\]]+)\]\((?:https?:)?\/\/[^)]+\)/g, '$1')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/~![\s\S]*?!~/g, '') // AniList spoiler blocks
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function fetchCharacterDetailUncached(id: number): Promise<CharacterDetail> {
  const first = await anilistQuery<CharacterResponse>(CHARACTER_QUERY, { id, page: 1 });
  const c = first.Character;
  if (!c) throw new Error('Character not found');

  let edges: MediaEdge[] = c.media?.edges ?? [];
  let hasNext = c.media?.pageInfo?.hasNextPage ?? false;
  let page = 1;

  while (hasNext && page < MAX_PAGES) {
    page += 1;
    try {
      const next = await anilistQuery<CharacterMediaPageResponse>(CHARACTER_MEDIA_PAGE_QUERY, {
        id,
        page,
      });
      const conn = next.Character?.media;
      if (!conn) break;
      edges = edges.concat(conn.edges);
      hasNext = conn.pageInfo?.hasNextPage ?? false;
    } catch {
      break;
    }
  }

  const works: CharacterWork[] = edges
    .filter((e) => e.node.type === 'ANIME')
    .map((e) => {
      const va = e.voiceActors?.[0];
      return {
        mediaId: e.node.id,
        title: {
          romaji: e.node.title.romaji || 'Untitled',
          english: e.node.title.english,
        },
        cover: e.node.coverImage?.extraLarge || e.node.coverImage?.large || '',
        year: e.node.startDate?.year ?? null,
        format: e.node.format,
        role: e.characterRole,
        vaId: va?.id ?? null,
        vaName: va?.name.full ?? null,
        vaImage: va?.image?.large ?? null,
      };
    })
    .sort((a, b) => (b.year ?? 9999) - (a.year ?? 9999));

  return {
    id: c.id,
    name: { full: c.name.full, native: c.name.native },
    image: c.image?.large ?? null,
    description: c.description ? cleanDescription(c.description) : null,
    gender: c.gender,
    age: c.age,
    works,
  };
}

export const fetchCharacterDetail = cache(fetchCharacterDetailUncached);
