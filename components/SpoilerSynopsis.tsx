'use client';

import { useState } from 'react';
import { Eye } from 'lucide-react';
import { useSettings } from '@/context/SettingsContext';

/** Blurs the synopsis for shows you're mid-watch when spoiler-safe is on. */
export function SpoilerSynopsis({ text, isWatching }: { text: string; isWatching: boolean }) {
  const { spoilerSafe } = useSettings();
  const [revealed, setRevealed] = useState(false);
  const blurred = spoilerSafe && isWatching && !revealed;

  return (
    <div className="relative">
      <p
        className={`text-sm sm:text-base text-fg-muted leading-relaxed whitespace-pre-wrap transition-[filter] duration-200 ${
          blurred ? 'blur-sm select-none pointer-events-none' : ''
        }`}
      >
        {text}
      </p>
      {blurred && (
        <button
          type="button"
          onClick={() => setRevealed(true)}
          className="absolute inset-0 flex items-center justify-center"
          aria-label="Reveal synopsis"
        >
          <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-lg">
            <Eye className="h-3.5 w-3.5" />
            Reveal synopsis
          </span>
        </button>
      )}
    </div>
  );
}
