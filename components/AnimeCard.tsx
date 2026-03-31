import Image from 'next/image';
import Link from 'next/link';
import { Anime, getDisplayTitle, getPrimaryStudio, getStatusLabel, getReleaseLabel, formatDateGMT8 } from '@/lib/anilist';

interface AnimeCardProps {
  anime: Anime;
}

export function AnimeCard({ anime }: AnimeCardProps) {
  const title = getDisplayTitle(anime);
  const studio = getPrimaryStudio(anime);
  const statusLabel = getStatusLabel(anime.status);
  const releaseLabel = getReleaseLabel(anime.status);
  const formattedDate = formatDateGMT8(anime.startDate);

  return (
    <Link href={`/anime/${anime.id}`} className="group flex flex-col rounded-[32px] md:rounded-xl overflow-hidden bg-gray-800 shadow-lg hover:shadow-2xl transition-all duration-300 md:hover:scale-105 active:scale-95 md:active:scale-100 cursor-pointer">
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
        
        {/* Gradient Overlay - Hidden on mobile, shown on hover for desktop */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent opacity-0 md:group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Desktop Hover Content - Only visible on md+ screens on hover */}
        <div className="hidden md:flex absolute inset-0 z-[2] p-4 lg:p-6 flex-col justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {/* Title */}
          <h3 className="text-lg lg:text-2xl font-bold text-white mb-2 lg:mb-3 line-clamp-3 leading-tight">
            {title}
          </h3>
          
          {/* Metadata: Studio • Episodes • Status • Release Date */}
          <div className="flex items-center flex-wrap gap-1.5 lg:gap-2 text-xs lg:text-sm text-gray-200 mb-2 lg:mb-4">
            <span className="font-medium">{studio}</span>
            
            {anime.episodes && (
              <>
                <span className="text-gray-400">•</span>
                <span>{anime.episodes} {anime.episodes === 1 ? 'ep' : 'eps'}</span>
              </>
            )}
            
            <span className="text-gray-400">•</span>
            <span className="font-medium">{statusLabel}</span>
            
            <span className="text-gray-400 hidden lg:inline">•</span>
            <span className="text-gray-300 hidden lg:inline">
              {releaseLabel} <span className="font-medium">{formattedDate}</span>
            </span>
          </div>
          
          {/* Genres */}
          {anime.genres && anime.genres.length > 0 && (
            <div className="flex flex-wrap gap-1.5 lg:gap-2">
              {anime.genres.slice(0, 4).map((genre) => (
                <span
                  key={genre}
                  className="px-2 lg:px-3 py-1 lg:py-1.5 text-xs lg:text-sm font-medium bg-violet-600/90 text-white rounded-lg shadow-lg"
                >
                  {genre}
                </span>
              ))}
            </div>
          )}
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
