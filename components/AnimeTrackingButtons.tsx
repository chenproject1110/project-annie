'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { toast } from 'sonner';
import { Play, CheckCircle, Bookmark, XCircle, Pause } from 'lucide-react';

export type TrackingStatus = 'watching' | 'completed' | 'planning' | 'dropped' | 'paused';

interface AnimeTrackingButtonsProps {
  animeId: number;
  animeTitle: string;
  animeTitleRomaji: string;
  coverImageUrl: string;
  initialStatus: TrackingStatus | null;
  isAuthenticated: boolean;
}

const STATUS_CONFIG: Record<
  TrackingStatus,
  { label: string; icon: typeof Play; color: string; glow: string; bg: string }
> = {
  watching: {
    label: 'Watching',
    icon: Play,
    color: 'text-cyan-400',
    glow: 'shadow-[0_0_14px_rgba(34,211,238,0.45)]',
    bg: 'bg-cyan-600',
  },
  completed: {
    label: 'Completed',
    icon: CheckCircle,
    color: 'text-emerald-400',
    glow: 'shadow-[0_0_14px_rgba(52,211,153,0.45)]',
    bg: 'bg-emerald-600',
  },
  planning: {
    label: 'Planning',
    icon: Bookmark,
    color: 'text-blue-400',
    glow: 'shadow-[0_0_14px_rgba(96,165,250,0.45)]',
    bg: 'bg-blue-600',
  },
  dropped: {
    label: 'Dropped',
    icon: XCircle,
    color: 'text-red-400',
    glow: 'shadow-[0_0_14px_rgba(248,113,113,0.45)]',
    bg: 'bg-red-600',
  },
  paused: {
    label: 'Paused',
    icon: Pause,
    color: 'text-amber-400',
    glow: 'shadow-[0_0_14px_rgba(251,191,36,0.45)]',
    bg: 'bg-amber-600',
  },
};

const STATUSES: TrackingStatus[] = ['watching', 'completed', 'planning', 'dropped', 'paused'];

export function AnimeTrackingButtons({
  animeId,
  animeTitle,
  animeTitleRomaji,
  coverImageUrl,
  initialStatus,
  isAuthenticated,
}: AnimeTrackingButtonsProps) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [activeStatus, setActiveStatus] = useState<TrackingStatus | null>(initialStatus);
  const [pending, setPending] = useState(false);

  const handleClick = useCallback(
    async (status: TrackingStatus) => {
      if (!isAuthenticated) {
        router.push(`/login?redirect=/anime/${animeId}`);
        return;
      }
      if (pending) return;

      const newStatus = activeStatus === status ? null : status;
      const prevStatus = activeStatus;
      setActiveStatus(newStatus);
      setPending(true);

      try {
        const res = await fetch('/api/tracking', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            animeId,
            status: newStatus,
          }),
        });
        if (!res.ok) throw new Error();
        if (newStatus) {
          toast.success(`Marked as ${STATUS_CONFIG[newStatus].label}`);
        } else {
          toast.success('Tracking removed');
        }
      } catch {
        setActiveStatus(prevStatus);
        toast.error('Failed to update tracking');
      } finally {
        setPending(false);
      }
    },
    [isAuthenticated, pending, activeStatus, animeId, router]
  );

  return (
    <div className="flex flex-wrap gap-2 pb-2 pt-1">
      {STATUSES.map((status) => {
        const cfg = STATUS_CONFIG[status];
        const Icon = cfg.icon;
        const isActive = activeStatus === status;

        return (
          <motion.button
            key={status}
            type="button"
            disabled={pending}
            onClick={() => handleClick(status)}
            whileTap={reduceMotion ? undefined : { scale: 0.95 }}
            animate={
              reduceMotion
                ? undefined
                : isActive
                  ? { scale: 1.02 }
                  : { scale: 1 }
            }
            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            className={`
              flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-medium
              transition-all duration-200 select-none
              disabled:opacity-60
              ${
                isActive
                  ? `${cfg.bg} ${cfg.glow} text-white border border-line/20`
                  : 'bg-black/40 backdrop-blur-md border border-line/10 text-fg-muted hover:text-white hover:border-line/20'
              }
            `}
            aria-pressed={isActive}
            aria-label={`${isActive ? 'Remove' : 'Set'} ${cfg.label}`}
          >
            <Icon className="h-3.5 w-3.5" />
            {cfg.label}
          </motion.button>
        );
      })}
    </div>
  );
}
