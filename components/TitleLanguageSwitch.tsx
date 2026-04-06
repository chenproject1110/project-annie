'use client';

import { useRef, useState, useLayoutEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  useTitleLanguage,
  type TitleLanguage,
} from '@/context/TitleLanguageContext';

const OPTIONS: readonly { value: TitleLanguage; label: string; short: string }[] = [
  { value: 'english', label: 'English', short: 'EN' },
  { value: 'romaji', label: 'Romaji', short: 'RMJ' },
] as const;

const SPRING = { type: 'spring', stiffness: 480, damping: 36, mass: 0.6 } as const;

interface TitleLanguageSwitchProps {
  compact?: boolean;
}

export function TitleLanguageSwitch({ compact = false }: TitleLanguageSwitchProps) {
  const { titleLanguage, setTitleLanguage } = useTitleLanguage();
  const reduceMotion = useReducedMotion();
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pill, setPill] = useState<{ left: number; width: number } | null>(null);

  useLayoutEffect(() => {
    const idx = OPTIONS.findIndex((o) => o.value === titleLanguage);
    const btn = buttonRefs.current[idx];
    const container = containerRef.current;
    if (!btn || !container) return;
    const cr = container.getBoundingClientRect();
    const br = btn.getBoundingClientRect();
    setPill({ left: br.left - cr.left, width: br.width });
  }, [titleLanguage]);

  return (
    <div
      ref={containerRef}
      className={`relative inline-flex rounded-full border border-white/15 bg-black/40 backdrop-blur-md shadow-[0_4px_24px_rgba(0,0,0,0.35)] ${compact ? 'p-0.5' : 'p-1'}`}
      role="group"
      aria-label="Title language"
    >
      {pill && (
        reduceMotion ? (
          <span
            className={`absolute rounded-full bg-purple-600 pointer-events-none ${compact ? 'top-0.5 bottom-0.5' : 'top-1 bottom-1'}`}
            style={{ left: pill.left, width: pill.width }}
            aria-hidden
          />
        ) : (
          <motion.span
            className={`absolute rounded-full bg-purple-600 pointer-events-none shadow-[0_0_14px_3px_rgba(147,51,234,0.45)] ${compact ? 'top-0.5 bottom-0.5' : 'top-1 bottom-1'}`}
            initial={false}
            animate={{ left: pill.left, width: pill.width }}
            transition={SPRING}
            aria-hidden
          />
        )
      )}

      {OPTIONS.map(({ value, label, short }, i) => {
        const selected = titleLanguage === value;
        return (
          <button
            key={value}
            ref={(el) => { buttonRefs.current[i] = el; }}
            type="button"
            onClick={() => setTitleLanguage(value)}
            className={
              compact
                ? 'relative z-[1] min-h-8 min-w-[2.5rem] px-2 text-[11px] font-semibold'
                : 'relative z-[1] min-h-9 min-w-[4.25rem] px-3 text-xs font-semibold sm:min-w-[4.75rem] sm:px-3.5 sm:text-sm'
            }
            aria-pressed={selected}
          >
            <motion.span
              className="select-none"
              animate={{ color: selected ? '#ffffff' : 'rgba(255,255,255,0.6)' }}
              transition={reduceMotion ? { duration: 0 } : { duration: 0.18, ease: 'easeOut' }}
            >
              {compact ? short : label}
            </motion.span>
          </button>
        );
      })}
    </div>
  );
}
