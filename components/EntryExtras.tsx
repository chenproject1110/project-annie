'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { toast } from 'sonner';
import { Heart, Repeat, Minus, Plus } from 'lucide-react';

interface EntryExtrasProps {
  animeId: number;
  initialFavourite: boolean;
  initialRewatches: number;
  initialNotes: string;
}

const DEBOUNCE_MS = 600;

export function EntryExtras({
  animeId,
  initialFavourite,
  initialRewatches,
  initialNotes,
}: EntryExtrasProps) {
  const reduceMotion = useReducedMotion();
  const [favourite, setFavourite] = useState(initialFavourite);
  const [rewatches, setRewatches] = useState(initialRewatches);
  const [notes, setNotes] = useState(initialNotes);
  const [notesSaved, setNotesSaved] = useState(true);

  const rewatchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notesTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const committedRewatch = useRef(initialRewatches);

  const post = useCallback(async (payload: Record<string, unknown>) => {
    const res = await fetch('/api/tracking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ animeId, ...payload }),
    });
    if (!res.ok) throw new Error();
  }, [animeId]);

  const toggleFavourite = useCallback(() => {
    const next = !favourite;
    setFavourite(next);
    post({ favourite: next }).catch(() => {
      setFavourite(!next);
      toast.error('Could not update favourite');
    });
  }, [favourite, post]);

  const bumpRewatch = useCallback(
    (delta: number) => {
      setRewatches((curr) => {
        const next = Math.max(0, curr + delta);
        if (next === curr) return curr;
        if (rewatchTimer.current) clearTimeout(rewatchTimer.current);
        rewatchTimer.current = setTimeout(() => {
          post({ rewatches: next })
            .then(() => (committedRewatch.current = next))
            .catch(() => {
              setRewatches(committedRewatch.current);
              toast.error('Could not update rewatches');
            });
        }, DEBOUNCE_MS);
        return next;
      });
    },
    [post],
  );

  const onNotesChange = (value: string) => {
    setNotes(value);
    setNotesSaved(false);
    if (notesTimer.current) clearTimeout(notesTimer.current);
    notesTimer.current = setTimeout(() => {
      post({ notes: value })
        .then(() => setNotesSaved(true))
        .catch(() => toast.error('Could not save notes'));
    }, DEBOUNCE_MS * 1.5);
  };

  useEffect(() => {
    return () => {
      if (rewatchTimer.current) clearTimeout(rewatchTimer.current);
      if (notesTimer.current) clearTimeout(notesTimer.current);
    };
  }, []);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-md p-3 sm:p-4 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={toggleFavourite}
          aria-pressed={favourite}
          className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-semibold border transition-colors active:scale-95 ${
            favourite
              ? 'bg-rose-500/15 border-rose-400/40 text-rose-300'
              : 'bg-black/40 border-white/10 text-gray-400 hover:text-white'
          }`}
        >
          <motion.span animate={reduceMotion ? undefined : favourite ? { scale: [1, 1.3, 1] } : { scale: 1 }} transition={{ duration: 0.3 }}>
            <Heart className="h-4 w-4" fill={favourite ? 'currentColor' : 'none'} />
          </motion.span>
          {favourite ? 'Favourite' : 'Favourite'}
        </button>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-xs text-gray-400">
            <Repeat className="h-3.5 w-3.5" /> Rewatches
          </span>
          <button
            type="button"
            onClick={() => bumpRewatch(-1)}
            disabled={rewatches <= 0}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-black/40 text-gray-300 hover:text-white disabled:opacity-40 transition-colors"
            aria-label="Decrease rewatches"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <span className="w-5 text-center text-sm font-semibold text-white tabular-nums">{rewatches}</span>
          <button
            type="button"
            onClick={() => bumpRewatch(1)}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-violet-400/30 bg-violet-600 text-white hover:bg-violet-500 transition-colors"
            aria-label="Increase rewatches"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs uppercase tracking-wide text-gray-400">Notes</span>
          <span className="text-[10px] text-gray-500">{notesSaved ? 'Saved' : 'Saving…'}</span>
        </div>
        <textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          rows={3}
          placeholder="Private notes — thoughts, where you left off…"
          className="w-full resize-none rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
        />
      </div>
    </div>
  );
}
