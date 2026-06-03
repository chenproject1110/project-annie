import Image from 'next/image';
import Link from 'next/link';
import { Character } from '@/lib/anilist';

interface CharacterCardProps {
  character: Character;
}

export function CharacterCard({ character }: CharacterCardProps) {
  const { node, voiceActors } = character;
  const va = voiceActors[0]; // Get first (Japanese) voice actor

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-750 transition-colors border border-gray-700">
      <div className="grid grid-cols-2 gap-0">
        {/* Character Side */}
        <div className="flex flex-col items-center p-4">
          <div className="relative w-20 h-20 rounded-full overflow-hidden mb-3 ring-2 ring-violet-500/50 bg-gray-700">
            {node.image.large ? (
              <Image
                src={node.image.large}
                alt={node.name.full}
                fill
                sizes="80px"
                className="object-cover"
              />
            ) : null}
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-white mb-1 line-clamp-2">
              {node.name.full}
            </p>
            {node.name.native && (
              <p className="text-xs text-gray-400 line-clamp-1">
                {node.name.native}
              </p>
            )}
          </div>
        </div>

        {/* Voice Actor Side — links to the VA page */}
        {va && (
          <Link
            href={`/staff/${va.id}`}
            className="group/va flex flex-col items-center p-4 border-l border-gray-700 transition-colors hover:bg-gray-750 active:scale-95"
            aria-label={`View voice actor ${va.name.full}`}
          >
            <div className="relative w-20 h-20 rounded-full overflow-hidden mb-3 ring-2 ring-gray-600 group-hover/va:ring-violet-500/60 bg-gray-700 transition-all">
              {va.image.large ? (
                <Image
                  src={va.image.large}
                  alt={va.name.full}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              ) : null}
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400 mb-1">CV</p>
              <p className="text-sm font-semibold text-gray-200 group-hover/va:text-white mb-1 line-clamp-2 transition-colors">
                {va.name.full}
              </p>
              {va.name.native && (
                <p className="text-xs text-gray-500 line-clamp-1">
                  {va.name.native}
                </p>
              )}
            </div>
          </Link>
        )}
      </div>
    </div>
  );
}
