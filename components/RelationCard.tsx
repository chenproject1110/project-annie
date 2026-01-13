import Image from 'next/image';
import Link from 'next/link';
import { Relation } from '@/lib/anilist';
import { formatRelationType } from '@/lib/anilist-detail';
import { getDisplayTitle } from '@/lib/anilist';

interface RelationCardProps {
  relation: Relation;
}

export function RelationCard({ relation }: RelationCardProps) {
  const { relationType, node } = relation;
  const title = getDisplayTitle(node);

  return (
    <Link href={`/anime/${node.id}`} className="group">
      <div className="bg-gray-800 rounded-lg overflow-hidden hover:ring-2 hover:ring-violet-500 transition-all">
        <div className="relative aspect-[2/3]">
          <Image
            src={node.coverImage.extraLarge}
            alt={title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-2 left-2">
            <span className="px-2 py-1 bg-violet-600/90 text-white text-xs font-semibold rounded">
              {formatRelationType(relationType)}
            </span>
          </div>
        </div>
        <div className="p-3">
          <p className="text-sm font-semibold text-white line-clamp-2">
            {title}
          </p>
          {node.format && (
            <p className="text-xs text-gray-400 mt-1">
              {node.format.replace('_', ' ')}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
