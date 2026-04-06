// Jikan API (MyAnimeList) — theme songs only (OP/ED not available from AniList)

const JIKAN_API_URL = 'https://api.jikan.moe/v4';

export interface AnimeThemes {
  openings: string[];
  endings: string[];
}

interface JikanThemesResponse {
  data: AnimeThemes;
}

/**
 * Fetch opening and ending themes from Jikan API (MyAnimeList)
 * @param malId - MyAnimeList ID
 * @returns Theme songs or null if not available
 */
export async function fetchAnimeThemes(malId: number | null): Promise<AnimeThemes | null> {
  if (!malId) return null;

  try {
    const response = await fetch(`${JIKAN_API_URL}/anime/${malId}/themes`, {
      next: {
        revalidate: 86400, // Cache for 24 hours (themes rarely change)
      },
    });

    if (!response.ok) {
      console.warn(`Jikan API error for MAL ID ${malId}: ${response.status}`);
      return null;
    }

    const json: JikanThemesResponse = await response.json();
    
    // Return null if no themes available
    if (!json.data.openings.length && !json.data.endings.length) {
      return null;
    }

    return json.data;
  } catch (error) {
    console.error('Error fetching themes from Jikan:', error);
    return null;
  }
}

/**
 * Parse theme string to extract title and artist
 * Format: "#1: \"Title\" by Artist" or "Title by Artist"
 * @param themeString - Raw theme string from Jikan
 * @returns Formatted theme string
 */
export function formatThemeString(themeString: string): string {
  // Remove episode numbers (e.g., "#1: " or "1: ")
  let formatted = themeString.replace(/^#?\d+:\s*/, '');
  
  // Clean up quotes if they exist
  formatted = formatted.replace(/["""]/g, '"');
  
  return formatted;
}
