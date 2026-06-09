import Image from 'next/image';
import Link from 'next/link';
import { SearchSuggestion } from '@/lib/anilist';

interface SearchSuggestionsProps {
  suggestions: SearchSuggestion[];
  isOpen: boolean;
  onClose: () => void;
}

export function SearchSuggestions({ suggestions, isOpen, onClose }: SearchSuggestionsProps) {
  if (!isOpen || suggestions.length === 0) return null;

  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-surface-2 border border-gray-700 rounded-lg shadow-2xl z-50 overflow-hidden">
      {suggestions.map((anime) => {
        const title = anime.title.english || anime.title.romaji;
        const year = anime.startDate.year || 'TBA';
        const format = anime.format?.replace('_', ' ') || 'Unknown';

        return (
          <Link
            key={anime.id}
            href={`/anime/${anime.id}`}
            onClick={onClose}
            className="flex items-center gap-3 p-3 hover:bg-violet-600/20 transition-colors border-b border-gray-800 last:border-0"
          >
            {/* Thumbnail */}
            <div className="relative w-12 h-16 flex-shrink-0 rounded overflow-hidden bg-surface">
              <Image
                src={anime.coverImage.medium}
                alt={title}
                fill
                sizes="48px"
                className="object-cover"
              />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-fg font-medium truncate">
                {title}
              </p>
              <p className="text-sm text-fg-muted">
                {format} • {year}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
