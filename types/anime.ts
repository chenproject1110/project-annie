/** Title fields used for display (English preferred, Romaji fallback). */
export interface MinimalAnimeTitle {
  english: string | null;
  romaji: string;
  native?: string | null;
}

/** Cover art used by cards and grids (Jikan `images.webp.large_image_url`). */
export interface MinimalAnimeCoverImage {
  extraLarge: string;
}

/** Shared card/grid shape: MAL id, localized title, cover art (grid + relation cards). */
export interface MinimalAnime {
  mal_id: number;
  title: MinimalAnimeTitle;
  coverImage: MinimalAnimeCoverImage;
}
