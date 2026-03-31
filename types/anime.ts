/** Title fields used for display (English preferred, Romaji fallback). */
export interface MinimalAnimeTitle {
  english: string | null;
  romaji: string;
  native?: string | null;
}

/** Cover art used by cards and grids (`extraLarge` from AniList). */
export interface MinimalAnimeCoverImage {
  extraLarge: string;
}

/** Shared card/grid shape: id, localized title, cover art (grid + relation cards). */
export interface MinimalAnime {
  id: number;
  title: MinimalAnimeTitle;
  coverImage: MinimalAnimeCoverImage;
}
