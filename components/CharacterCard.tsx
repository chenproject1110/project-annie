import Image from 'next/image';
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
          <div className="relative w-20 h-20 rounded-full overflow-hidden mb-3 ring-2 ring-violet-500/50">
            <Image
              src={node.image.large}
              alt={node.name.full}
              fill
              sizes="80px"
              className="object-cover"
            />
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

        {/* Voice Actor Side */}
        {va && (
          <div className="flex flex-col items-center p-4 border-l border-gray-700">
            <div className="relative w-20 h-20 rounded-full overflow-hidden mb-3 ring-2 ring-gray-600">
              <Image
                src={va.image.large}
                alt={va.name.full}
                fill
                sizes="80px"
                className="object-cover"
              />
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400 mb-1">CV</p>
              <p className="text-sm font-semibold text-gray-200 mb-1 line-clamp-2">
                {va.name.full}
              </p>
              {va.name.native && (
                <p className="text-xs text-gray-500 line-clamp-1">
                  {va.name.native}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
