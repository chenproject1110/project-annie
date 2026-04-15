// AnimeThemes API (primary) with official MAL API v2 fallback for OP/ED data

const ANIMETHEMES_API_URL = 'https://api.animethemes.moe';
const MAL_API_URL = 'https://api.myanimelist.net/v2';

export interface ThemeEntry {
  slug: string;        // e.g. "OP1", "ED2"
  type: 'OP' | 'ED';
  sequence: number;
  songTitle: string;
  artists: string[];
  episodes: string | null;
  videoUrl: string | null;
}

export interface AnimeThemes {
  openings: ThemeEntry[];
  endings: ThemeEntry[];
}

interface ATArtist {
  name: string;
}

interface ATVideo {
  link: string;
  resolution: number;
  nc: boolean;
  source: string;
}

interface ATThemeEntry {
  episodes: string | null;
  version: number;
  videos: ATVideo[];
}

interface ATSong {
  title: string;
  artists: ATArtist[];
}

interface ATAnimeTheme {
  type: 'OP' | 'ED';
  sequence: number;
  slug: string;
  song: ATSong | null;
  animethemeentries: ATThemeEntry[];
}

interface ATAnime {
  animethemes: ATAnimeTheme[];
}

interface ATResponse {
  anime: ATAnime[];
}

function pickBestVideo(entries: ATThemeEntry[]): string | null {
  const credited = entries.flatMap((e) =>
    e.videos.filter((v) => !v.nc)
  );
  if (credited.length > 0) {
    const best =
      credited.find((v) => v.source === 'BD') ||
      credited.find((v) => v.source === 'WEB') ||
      credited[0];
    return best.link;
  }
  const all = entries.flatMap((e) => e.videos);
  return all[0]?.link ?? null;
}

function collectEpisodes(entries: ATThemeEntry[]): string | null {
  const parts = entries
    .filter((e) => e.episodes)
    .map((e) => e.episodes as string);
  return parts.length > 0 ? parts.join(', ') : null;
}

async function fetchFromAnimeThemes(malId: number): Promise<AnimeThemes | null> {
  try {
    const url =
      `${ANIMETHEMES_API_URL}/anime` +
      `?filter[has]=resources` +
      `&filter[site]=MyAnimeList` +
      `&filter[external_id]=${malId}` +
      `&include=animethemes.song.artists,animethemes.animethemeentries.videos`;

    const response = await fetch(url, {
      headers: { 'User-Agent': 'ProjectAnnie/1.0' },
      next: { revalidate: 86400 },
    });

    if (!response.ok) return null;

    const json: ATResponse = await response.json();

    if (!json.anime || json.anime.length === 0) return null;

    const themes = json.anime[0].animethemes ?? [];

    const toEntry = (t: ATAnimeTheme): ThemeEntry => ({
      slug: t.slug,
      type: t.type,
      sequence: t.sequence,
      songTitle: t.song?.title ?? 'Unknown',
      artists: t.song?.artists?.map((a) => a.name) ?? [],
      episodes: collectEpisodes(t.animethemeentries ?? []),
      videoUrl: pickBestVideo(t.animethemeentries ?? []),
    });

    const isJapanese = (slug: string) => !slug.includes('-EN');

    const openings = themes
      .filter((t) => t.type === 'OP' && isJapanese(t.slug))
      .sort((a, b) => a.sequence - b.sequence)
      .map(toEntry);

    const endings = themes
      .filter((t) => t.type === 'ED' && isJapanese(t.slug))
      .sort((a, b) => a.sequence - b.sequence)
      .map(toEntry);

    if (openings.length === 0 && endings.length === 0) return null;

    return { openings, endings };
  } catch {
    return null;
  }
}

function parseThemeString(raw: string, type: 'OP' | 'ED', index: number): ThemeEntry {
  const seqMatch = raw.match(/^#?(\d+):\s*/);
  const sequence = seqMatch ? parseInt(seqMatch[1], 10) : index + 1;
  const cleaned = raw.replace(/^#?\d+:\s*/, '');

  const titleMatch = cleaned.match(/["""](.+?)["""]/);
  const songTitle = titleMatch ? titleMatch[1] : cleaned.split(' by ')[0].trim();

  const artistMatch = cleaned.match(/by\s+(.+?)(?:\s*\(|$)/);
  const artists = artistMatch
    ? artistMatch[1].split(/,\s*(?:and\s+)?|(?:\s+and\s+)/).map((a) => a.trim()).filter(Boolean)
    : [];

  const epsMatch = cleaned.match(/\(eps?\s*\.?\s*(.+?)\)/i);
  const episodes = epsMatch ? epsMatch[1] : null;

  return {
    slug: `${type}${sequence}`,
    type,
    sequence,
    songTitle,
    artists,
    episodes,
    videoUrl: null,
  };
}

interface MALThemeItem {
  id: number;
  anime_id: number;
  text: string;
}

interface MALAnimeResponse {
  opening_themes?: MALThemeItem[];
  ending_themes?: MALThemeItem[];
}

async function fetchFromMAL(malId: number): Promise<AnimeThemes | null> {
  const clientId = process.env.MAL_CLIENT_ID;
  if (!clientId) return null;

  try {
    const response = await fetch(
      `${MAL_API_URL}/anime/${malId}?fields=opening_themes,ending_themes`,
      {
        headers: { 'X-MAL-CLIENT-ID': clientId },
        next: { revalidate: 86400 },
      },
    );

    if (!response.ok) return null;

    const json: MALAnimeResponse = await response.json();
    const rawOps = json.opening_themes ?? [];
    const rawEds = json.ending_themes ?? [];

    if (!rawOps.length && !rawEds.length) return null;

    return {
      openings: rawOps.map((t, i) => parseThemeString(t.text, 'OP', i)),
      endings: rawEds.map((t, i) => parseThemeString(t.text, 'ED', i)),
    };
  } catch {
    return null;
  }
}

export async function fetchAnimeThemes(malId: number | null): Promise<AnimeThemes | null> {
  if (!malId) return null;

  const rich = await fetchFromAnimeThemes(malId);
  if (rich) return rich;

  return fetchFromMAL(malId);
}
