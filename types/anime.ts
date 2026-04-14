/** Title fields used for display (English preferred, Romaji fallback). */
export interface MinimalAnimeTitle {
  english: string | null;
  romaji: string;
  native?: string | null;
}

/** AniList cover-image URLs at various resolutions. */
export interface MinimalAnimeCoverImage {
  medium?: string | null;
  large?: string | null;
  extraLarge?: string | null;
}

/** Shared card/grid shape: AniList id, localized title, cover art (grid + relation cards). */
export interface MinimalAnime {
  id: number;
  title: MinimalAnimeTitle;
  coverImage: MinimalAnimeCoverImage;
}
