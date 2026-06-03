import { Music } from 'lucide-react';
import { fetchAnimeThemes } from '@/lib/jikan';

/**
 * Streamed (Suspense) theme-songs section. Kept separate from the detail page
 * so the main content paints as soon as the AniList detail resolves, instead of
 * blocking on the slower AnimeThemes → MAL fallback chain.
 */
export async function ThemeSongs({ idMal }: { idMal: number | null }) {
  let themes: Awaited<ReturnType<typeof fetchAnimeThemes>> = null;
  try {
    themes = await fetchAnimeThemes(idMal);
  } catch {
    return null;
  }

  if (!themes || (themes.openings.length === 0 && themes.endings.length === 0)) {
    return null;
  }

  return (
    <div>
      <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">Theme Songs</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        {themes.openings.length > 0 && (
          <div className="p-4 sm:p-5 bg-gray-800 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Music className="w-4 h-4 sm:w-5 sm:h-5 text-violet-400 flex-shrink-0" />
              <p className="text-sm font-semibold text-violet-400 uppercase tracking-wide">
                Opening{themes.openings.length > 1 ? 's' : ''}
              </p>
            </div>
            <ul className="space-y-2.5">
              {themes.openings.map((op) => (
                <li key={op.slug} className="text-sm leading-relaxed">
                  <span className="text-violet-300 font-medium mr-1.5">{op.slug}.</span>
                  <span className="text-gray-100">&ldquo;{op.songTitle}&rdquo;</span>
                  {op.artists.length > 0 && (
                    <span className="text-gray-400"> by {op.artists.join(', ')}</span>
                  )}
                  {op.episodes && (
                    <span className="text-gray-500 text-xs ml-1.5">(ep. {op.episodes})</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {themes.endings.length > 0 && (
          <div className="p-4 sm:p-5 bg-gray-800 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Music className="w-4 h-4 sm:w-5 sm:h-5 text-violet-400 flex-shrink-0" />
              <p className="text-sm font-semibold text-violet-400 uppercase tracking-wide">
                Ending{themes.endings.length > 1 ? 's' : ''}
              </p>
            </div>
            <ul className="space-y-2.5">
              {themes.endings.map((ed) => (
                <li key={ed.slug} className="text-sm leading-relaxed">
                  <span className="text-violet-300 font-medium mr-1.5">{ed.slug}.</span>
                  <span className="text-gray-100">&ldquo;{ed.songTitle}&rdquo;</span>
                  {ed.artists.length > 0 && (
                    <span className="text-gray-400"> by {ed.artists.join(', ')}</span>
                  )}
                  {ed.episodes && (
                    <span className="text-gray-500 text-xs ml-1.5">(ep. {ed.episodes})</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export function ThemeSongsSkeleton() {
  return (
    <div>
      <div className="h-7 sm:h-8 w-40 rounded-lg bg-white/10 animate-pulse mb-3 sm:mb-4" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        <div className="h-32 rounded-lg bg-white/5 animate-pulse" />
        <div className="h-32 rounded-lg bg-white/5 animate-pulse" />
      </div>
    </div>
  );
}
