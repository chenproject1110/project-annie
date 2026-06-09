'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { toast } from 'sonner';
import { Play, CheckCircle, Bookmark, XCircle, Pause, Minus, Plus, Check } from 'lucide-react';
import { useTracking, type TrackingStatus } from '@/context/TrackingContext';
import { hapticLight, hapticMedium, hapticSuccess } from '@/lib/haptics';

interface TrackingPanelProps {
  animeId: number;
  totalEpisodes: number | null;
  initialStatus: TrackingStatus | null;
  initialProgress: number;
  isAuthenticated: boolean;
  showEpisodes: boolean;
}

const STATUS_CONFIG: Record<
  TrackingStatus,
  { label: string; icon: typeof Play; glow: string; bg: string }
> = {
  watching: { label: 'Watching', icon: Play, glow: 'shadow-[0_0_14px_rgba(34,211,238,0.45)]', bg: 'bg-cyan-600' },
  completed: { label: 'Completed', icon: CheckCircle, glow: 'shadow-[0_0_14px_rgba(52,211,153,0.45)]', bg: 'bg-emerald-600' },
  planning: { label: 'Planning', icon: Bookmark, glow: 'shadow-[0_0_14px_rgba(96,165,250,0.45)]', bg: 'bg-blue-600' },
  dropped: { label: 'Dropped', icon: XCircle, glow: 'shadow-[0_0_14px_rgba(248,113,113,0.45)]', bg: 'bg-red-600' },
  paused: { label: 'Paused', icon: Pause, glow: 'shadow-[0_0_14px_rgba(251,191,36,0.45)]', bg: 'bg-amber-600' },
};

const STATUSES: TrackingStatus[] = ['watching', 'completed', 'planning', 'dropped', 'paused'];
const WRITE_DEBOUNCE_MS = 500;

export function TrackingPanel({
  animeId,
  totalEpisodes,
  initialStatus,
  initialProgress,
  isAuthenticated,
  showEpisodes,
}: TrackingPanelProps) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const { refresh } = useTracking();

  const [status, setStatus] = useState<TrackingStatus | null>(initialStatus);
  const [progress, setProgress] = useState(initialProgress);
  const [statusPending, setStatusPending] = useState(false);

  const committedProgress = useRef(initialProgress);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const max = totalEpisodes && totalEpisodes > 0 ? totalEpisodes : null;
  const atMax = max != null && progress >= max;

  const post = useCallback(
    (payload: Record<string, unknown>) =>
      fetch('/api/tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ animeId, ...payload }),
      }).then((res) => {
        if (!res.ok) throw new Error();
      }),
    [animeId],
  );

  const handleStatus = useCallback(
    (s: TrackingStatus) => {
      if (!isAuthenticated) {
        router.push(`/login?redirect=/anime/${animeId}`);
        return;
      }
      if (statusPending) return;

      const newStatus = status === s ? null : s;
      const prevStatus = status;
      const prevProgress = progress;
      setStatus(newStatus);
      setStatusPending(true);
      if (newStatus === 'completed') hapticSuccess();
      else hapticMedium();

      // Removal.
      if (newStatus === null) {
        post({ status: null })
          .then(() => {
            toast.success('Tracking removed');
            refresh();
          })
          .catch(() => {
            setStatus(prevStatus);
            toast.error('Failed to update tracking');
          })
          .finally(() => setStatusPending(false));
        return;
      }

      // Completing a show with a known episode count snaps progress to the max.
      const payload: Record<string, unknown> = {
        status: newStatus,
        totalEpisodes: totalEpisodes ?? undefined,
      };
      if (newStatus === 'completed' && max != null && progress < max) {
        setProgress(max);
        committedProgress.current = max;
        payload.progress = max;
      }

      post(payload)
        .then(() => {
          toast.success(`Marked as ${STATUS_CONFIG[newStatus].label}`);
          refresh();
        })
        .catch(() => {
          setStatus(prevStatus);
          setProgress(prevProgress);
          committedProgress.current = prevProgress;
          toast.error('Failed to update tracking');
        })
        .finally(() => setStatusPending(false));
    },
    [animeId, isAuthenticated, max, post, progress, refresh, router, status, statusPending, totalEpisodes],
  );

  const flush = useCallback(
    (value: number) => {
      const needsStatus = status == null && value > 0;
      post({
        progress: value,
        totalEpisodes: totalEpisodes ?? undefined,
        ...(needsStatus ? { status: 'watching' } : {}),
      })
        .then(() => {
          committedProgress.current = value;
          if (needsStatus) {
            setStatus('watching');
            refresh();
          }
        })
        .catch(() => {
          setProgress(committedProgress.current);
          toast.error('Failed to save progress');
        });
    },
    [post, refresh, status, totalEpisodes],
  );

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
        hapticLight();
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => flush(next), WRITE_DEBOUNCE_MS);
        return next;
      });
    },
    [animeId, flush, isAuthenticated, max, router],
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const pct = max != null ? Math.min(100, Math.round((progress / max) * 100)) : 0;

  return (
    <div className="space-y-3">
      {/* Status buttons */}
      <div className="flex flex-wrap gap-2 pb-1 pt-1">
        {STATUSES.map((s) => {
          const cfg = STATUS_CONFIG[s];
          const Icon = cfg.icon;
          const isActive = status === s;
          return (
            <motion.button
              key={s}
              type="button"
              disabled={statusPending}
              onClick={() => handleStatus(s)}
              whileTap={reduceMotion ? undefined : { scale: 0.95 }}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-medium transition-all duration-200 select-none disabled:opacity-60 ${
                isActive
                  ? `${cfg.bg} ${cfg.glow} text-white border border-line/20`
                  : 'bg-black/40 backdrop-blur-md border border-line/10 text-fg-muted hover:text-white hover:border-line/20'
              }`}
              aria-pressed={isActive}
            >
              <Icon className="h-3.5 w-3.5" />
              {cfg.label}
            </motion.button>
          );
        })}
      </div>

      {/* Episode progress */}
      {showEpisodes && (
        <div className="rounded-2xl border border-line/10 bg-line/[0.04] backdrop-blur-md p-3 sm:p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-col">
              <span className="text-xs uppercase tracking-wide text-fg-muted">Episodes</span>
              <span className="text-sm font-semibold text-white tabular-nums">
                {progress}
                <span className="text-fg-muted"> / {max ?? '?'}</span>
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
                className="flex h-9 w-9 items-center justify-center rounded-full border border-line/10 bg-black/40 text-fg-muted hover:text-white hover:border-line/20 disabled:opacity-40 transition-colors"
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
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-line/10" aria-hidden>
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-400"
                animate={{ width: `${pct}%` }}
                transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 200, damping: 30 }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
