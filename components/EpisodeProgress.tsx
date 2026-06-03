'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { toast } from 'sonner';
import { Minus, Plus, Check } from 'lucide-react';
import { useTracking, type TrackingStatus } from '@/context/TrackingContext';

interface EpisodeProgressProps {
  animeId: number;
  totalEpisodes: number | null;
  initialProgress: number;
  initialStatus: TrackingStatus | null;
  isAuthenticated: boolean;
}

const WRITE_DEBOUNCE_MS = 500;

export function EpisodeProgress({
  animeId,
  totalEpisodes,
  initialProgress,
  initialStatus,
  isAuthenticated,
}: EpisodeProgressProps) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const { refresh } = useTracking();

  const [progress, setProgress] = useState(initialProgress);
  const [saving, setSaving] = useState(false);

  // Last value confirmed by the server — used to roll back on failure.
  const committedRef = useRef(initialProgress);
  const statusRef = useRef<TrackingStatus | null>(initialStatus);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const max = totalEpisodes && totalEpisodes > 0 ? totalEpisodes : null;
  const atMax = max != null && progress >= max;

  const flush = useCallback(
    async (value: number) => {
      setSaving(true);
      // If the show isn't tracked yet, incrementing implies you're watching it.
      const needsStatus = statusRef.current == null && value > 0;
      try {
        const res = await fetch('/api/tracking', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            animeId,
            progress: value,
            totalEpisodes: totalEpisodes ?? undefined,
            ...(needsStatus ? { status: 'watching' } : {}),
          }),
        });
        if (!res.ok) throw new Error();
        committedRef.current = value;
        if (needsStatus) {
          statusRef.current = 'watching';
          refresh(); // resync badges elsewhere
        }
      } catch {
        setProgress(committedRef.current);
        toast.error('Failed to save progress');
      } finally {
        setSaving(false);
      }
    },
    [animeId, totalEpisodes, refresh]
  );

  const scheduleFlush = useCallback(
    (value: number) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => flush(value), WRITE_DEBOUNCE_MS);
    },
    [flush]
  );

  // Flush any pending write if the user navigates away mid-debounce.
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const step = useCallback(
    (delta: number) => {
      if (!isAuthenticated) {
        router.push(`/login?redirect=/anime/${animeId}`);
        return;
      }
      setProgress((curr) => {
        let next = curr + delta;
        if (next < 0) next = 0;
        if (max != null && next > max) next = max;
        if (next === curr) return curr;
        scheduleFlush(next);
        return next;
      });
    },
    [isAuthenticated, router, animeId, max, scheduleFlush]
  );

  const pct = max != null ? Math.min(100, Math.round((progress / max) * 100)) : 0;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-md p-3 sm:p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col">
          <span className="text-xs uppercase tracking-wide text-gray-400">Episodes</span>
          <span className="text-sm font-semibold text-white tabular-nums">
            {progress}
            <span className="text-gray-500"> / {max ?? '?'}</span>
            {atMax && (
              <span className="ml-2 inline-flex items-center gap-1 text-emerald-400">
                <Check className="h-3.5 w-3.5" />
                Caught up
              </span>
            )}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <motion.button
            type="button"
            onClick={() => step(-1)}
            disabled={progress <= 0}
            whileTap={reduceMotion ? undefined : { scale: 0.9 }}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/40 text-gray-300 hover:text-white hover:border-white/20 disabled:opacity-40 disabled:hover:text-gray-300 transition-colors"
            aria-label="Decrease episodes watched"
          >
            <Minus className="h-4 w-4" />
          </motion.button>
          <motion.button
            type="button"
            onClick={() => step(1)}
            disabled={atMax}
            whileTap={reduceMotion ? undefined : { scale: 0.9 }}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-violet-400/30 bg-violet-600 text-white shadow-[0_0_14px_rgba(139,92,246,0.35)] hover:bg-violet-500 disabled:opacity-40 transition-colors"
            aria-label="Increase episodes watched"
          >
            <Plus className="h-4 w-4" />
          </motion.button>
        </div>
      </div>

      {max != null && (
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10" aria-hidden>
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-400"
            animate={{ width: `${pct}%` }}
            transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 200, damping: 30 }}
          />
        </div>
      )}

      <span className="sr-only" role="status">
        {saving ? 'Saving progress' : 'Progress saved'}
      </span>
    </div>
  );
}
