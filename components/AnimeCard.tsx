import Image from 'next/image';
import Link from 'next/link';
import { Anime, getDisplayTitle, getPrimaryStudio, getStatusLabel, getReleaseLabel, formatDateGMT8 } from '@/lib/anilist';

interface AnimeCardProps {
  anime: Anime;
}

/** Keeps hover copy readable on bright posters (sky, hair highlights, etc.). */
const hoverCopyShadow =
  '[text-shadow:0_1px_12px_rgba(0,0,0,0.95),0_0_2px_rgba(0,0,0,1)]';

export function AnimeCard({ anime }: AnimeCardProps) {
  const title = getDisplayTitle(anime);
  const studio = getPrimaryStudio(anime);
  const statusLabel = getStatusLabel(anime.status);
  const releaseLabel = getReleaseLabel(anime.status);
  const formattedDate = formatDateGMT8(anime.startDate);

  return (
    <Link href={`/anime/${anime.mal_id}`} className="group flex flex-col rounded-[32px] md:rounded-xl overflow-hidden bg-gray-800 shadow-lg hover:shadow-2xl transition-all duration-300 md:hover:scale-105 active:scale-95 md:active:scale-100 cursor-pointer">
      {/* Cover Image Container - Fixed Aspect Ratio */}
      <div className="relative w-full aspect-[2/3] overflow-hidden">
        <Image
          src={anime.coverImage.extraLarge}
          alt={title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
          className="object-cover w-full h-full"
          priority={false}
        />

        {/* Desktop Hover: full-card scrim + anchored copy so text fits narrow tiles */}
        <div className="hidden md:flex absolute inset-0 z-[2] min-h-0 min-w-0 flex-col opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <div
            className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/65 to-black/90"
            aria-hidden
          />
          <div className="relative flex h-full min-h-0 min-w-0 flex-col items-stretch justify-end gap-2 lg:gap-3 p-3 lg:p-5">
            <h3
              className={`shrink-0 text-base lg:text-xl font-bold text-white line-clamp-3 leading-tight break-words ${hoverCopyShadow}`}
            >
              {title}
            </h3>
            <p
              className={`shrink-0 text-[11px] lg:text-xs font-medium text-white/90 break-words ${hoverCopyShadow}`}
            >
              {studio} - {statusLabel}
              {anime.episodes != null && anime.episodes > 0 ? (
                <>
                  {' '}
                  <span className="text-white/55">·</span>
                  {` ${anime.episodes} ${anime.episodes === 1 ? 'ep' : 'eps'}`}
                </>
              ) : null}
            </p>
            <p
              className={`shrink-0 text-xs lg:text-sm text-white/90 break-words ${hoverCopyShadow}`}
            >
              {releaseLabel}{' '}
              <span className="font-semibold text-white">{formattedDate}</span>
            </p>
            {anime.genres && anime.genres.length > 0 && (
              <div className="flex min-w-0 shrink-0 flex-wrap gap-1 lg:gap-1.5">
                {anime.genres.slice(0, 4).map((genre) => (
                  <span
                    key={genre}
                    className="max-w-full truncate px-1.5 py-0.5 lg:px-2 lg:py-1 text-[10px] lg:text-xs font-medium bg-violet-600/90 text-white rounded-md shadow-md"
                    title={genre}
                  >
                    {genre}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Mobile: one layer — gradient meets image with no gap above card edge */}
        <div className="md:hidden absolute inset-x-0 bottom-0 z-[1] bg-gradient-to-t from-black via-black/80 to-transparent px-2.5 sm:px-3 pt-12 pb-1.5 sm:pb-2">
          <h3 className="text-xs sm:text-sm font-semibold text-white line-clamp-2 leading-snug">
            {title}
          </h3>
          <p className="text-[10px] sm:text-xs text-gray-300 line-clamp-1 mt-0.5">
            {studio} {anime.episodes && `• ${anime.episodes} eps`}
          </p>
        </div>
        
        {/* Desktop: Quick Info Bar (hidden on hover) */}
        <div className="hidden md:block absolute inset-x-0 bottom-0 z-[1] bg-gradient-to-t from-black via-black/80 to-transparent px-3 pt-12 pb-2.5 group-hover:opacity-0 transition-opacity duration-300">
          <h3 className="text-sm font-semibold text-white line-clamp-2">
            {title}
          </h3>
        </div>
      </div>
    </Link>
  );
}
