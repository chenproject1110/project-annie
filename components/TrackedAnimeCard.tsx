'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useTitleLanguage } from '@/context/TitleLanguageContext';

interface TrackedAnimeCardProps {
  animeId: number;
  animeTitle: string | null;
  animeTitleRomaji: string | null;
  coverImageUrl: string | null;
}

export function TrackedAnimeCard({
  animeId,
  animeTitle,
  animeTitleRomaji,
  coverImageUrl,
}: TrackedAnimeCardProps) {
  const { titleLanguage } = useTitleLanguage();
  const displayTitle =
    titleLanguage === 'romaji'
      ? animeTitleRomaji || animeTitle || 'Unknown'
      : animeTitle || animeTitleRomaji || 'Unknown';

  return (
    <Link
      href={`/anime/${animeId}`}
      className="group flex flex-col rounded-[32px] md:rounded-xl overflow-hidden bg-gray-800 shadow-lg hover:shadow-2xl transition-all duration-300 md:hover:scale-105 active:scale-95 md:active:scale-100 cursor-pointer"
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
          <div className="h-full w-full bg-gray-700 flex items-center justify-center">
            <span className="text-gray-500 text-xs">No Image</span>
          </div>
        )}
      </div>
      <div className="p-2 sm:p-3">
        <p className="text-xs sm:text-sm font-medium text-white line-clamp-2 leading-tight">
          {displayTitle}
        </p>
      </div>
    </Link>
  );
}
