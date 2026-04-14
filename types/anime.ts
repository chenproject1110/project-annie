/** Title fields used for display (English preferred, Romaji fallback). */
export interface MinimalAnimeTitle {
  english: string | null;
  romaji: string;
  native?: string | null;
}

/** Shared card/grid shape: AniList id, localized title, cover art (grid + relation cards). */
export interface MinimalAnime {
  id: number;
  title: MinimalAnimeTitle;
  coverImage: MinimalAnimeCoverImage;
}
