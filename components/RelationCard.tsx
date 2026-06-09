'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Relation } from '@/lib/anilist';
import { formatRelationType } from '@/lib/anilist-detail';
import { getDisplayTitle } from '@/lib/anilist';
import { useTrackingStatus, TRACKING_BADGE } from '@/context/TrackingContext';

interface RelationCardProps {
  relation: Relation;
}

export function RelationCard({ relation }: RelationCardProps) {
  const { relationType, node } = relation;
  const title = getDisplayTitle(node);
  const trackingStatus = useTrackingStatus(node.id);

  return (
    <Link href={`/anime/${node.id}`} className="group">
      <div className="bg-surface rounded-lg overflow-hidden hover:ring-2 hover:ring-violet-500 transition-all">
        <div className="relative aspect-[2/3]">
          {node.coverImage.extraLarge ? (
            <Image
              src={node.coverImage.extraLarge}
              alt={title}
              fill
              sizes="(max-width: 640px) 42vw, (max-width: 1024px) 25vw, 200px"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div
              className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-900"
              aria-hidden
            />
          )}
          <div className="absolute top-2 left-2">
            <span className="px-2 py-1 bg-violet-600/90 text-white text-xs font-semibold rounded">
              {formatRelationType(relationType)}
            </span>
          </div>
          {trackingStatus && (() => {
            const badge = TRACKING_BADGE[trackingStatus];
            const BadgeIcon = badge.icon;
            return (
              <div className={`absolute bottom-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded-md backdrop-blur-md border text-[9px] sm:text-[10px] font-semibold text-white ${badge.bg} ${badge.border}`}>
                <BadgeIcon className="w-2.5 h-2.5" strokeWidth={2.5} />
                {badge.label}
              </div>
            );
          })()}
        </div>
        <div className="p-3">
          <p className="text-sm font-semibold text-white line-clamp-2">
            {title}
          </p>
          {node.format && (
            <p className="text-xs text-fg-muted mt-1">
              {node.format.replace('_', ' ')}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
