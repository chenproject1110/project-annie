'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { useTitleLanguage } from '@/context/TitleLanguageContext';
import { useTrackingProgress } from '@/context/TrackingContext';
import { CoverProgressBar } from '@/components/CoverProgressBar';

interface TrackedAnimeCardProps {
  animeId: number;
  animeTitle: string | null;
  animeTitleRomaji: string | null;
  coverImageUrl: string | null;
  favourite?: boolean;
}

export function TrackedAnimeCard({
  animeId,
  animeTitle,
  animeTitleRomaji,
  coverImageUrl,
  favourite = false,
}: TrackedAnimeCardProps) {
  const { titleLanguage } = useTitleLanguage();
  const trackingProgress = useTrackingProgress(animeId);
  const displayTitle =
    titleLanguage === 'romaji'
      ? animeTitleRomaji || animeTitle || 'Unknown'
      : animeTitle || animeTitleRomaji || 'Unknown';

  return (
    <Link
      href={`/anime/${animeId}`}
      className="group flex flex-col rounded-xl overflow-hidden bg-surface shadow-lg hover:shadow-2xl transition-all duration-300 md:hover:scale-105 active:scale-95 md:active:scale-100 cursor-pointer"
    >
      <div className="relative w-full aspect-[2/3] overflow-hidden">
        {coverImageUrl ? (
          <Image
            src={coverImageUrl}
            alt={displayTitle}
            fill
            sizes="(max-width: 640px) 42vw, 168px"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="h-full w-full bg-surface-2 flex items-center justify-center">
            <span className="text-fg-muted text-xs">No Image</span>
          </div>
        )}
        {favourite && (
          <div className="absolute top-1.5 left-1.5 z-[3] flex h-5 w-5 items-center justify-center rounded-full bg-black/55 backdrop-blur-sm">
            <Heart className="h-3 w-3 text-rose-400" fill="currentColor" />
          </div>
        )}
        {trackingProgress && (
          <CoverProgressBar
            progress={trackingProgress.progress}
            total={trackingProgress.total}
          />
        )}
      </div>
      <div className="p-2 sm:p-3 h-[60px] flex items-center">
        <p className="text-xs sm:text-sm font-medium text-fg line-clamp-2 leading-tight">
          {displayTitle}
        </p>
      </div>
    </Link>
  );
}
