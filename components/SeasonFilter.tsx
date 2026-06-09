'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition, useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { Season } from '@/lib/anilist';

interface SeasonFilterProps {
  currentYear: number;
  currentSeason: Season;
}

const SEASONS: Season[] = ['WINTER', 'SPRING', 'SUMMER', 'FALL'];

const SEASON_LABELS: Record<Season, string> = {
  WINTER: 'Winter',
  SPRING: 'Spring',
  SUMMER: 'Summer',
  FALL: 'Fall',
};

function getAvailableYears(): number[] {
  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let year = 2013; year <= currentYear + 1; year++) {
    years.push(year);
  }
  return years.reverse();
}

interface YearMenuProps {
  value: number;
  years: number[];
  onSelect: (year: number) => void;
}

function YearMenu({ value, years, onSelect }: YearMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDocDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="relative flex-shrink-0" ref={rootRef}>
      <span id="year-field-label" className="block text-xs sm:text-sm font-medium text-fg-muted mb-1 sm:mb-2">
        Year
      </span>
      <button
        type="button"
        id="year-menu-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby="year-field-label year-menu-trigger"
        onClick={() => setOpen((o) => !o)}
        className={[
          'group inline-flex min-h-[2.875rem] sm:min-h-[3.25rem] items-center gap-2',
          'rounded-xl border px-4 py-3 text-left text-sm sm:text-base font-medium text-fg',
          'bg-line/[0.04] backdrop-blur-md',
          'outline-none transition-all duration-200',
          'hover:border-line/20 hover:bg-line/[0.06]',
          'focus-visible:border-violet-500 focus-visible:ring-2 focus-visible:ring-violet-500/55 focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
          'active:scale-[0.99]',
          open ? 'border-violet-500/50 bg-violet-600/10' : 'border-line/10',
        ].join(' ')}
      >
        <span className="tabular-nums">{value}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-violet-400 transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
          aria-hidden
        />
      </button>

      {open ? (
        <ul
          role="listbox"
          aria-labelledby="year-field-label"
          className="absolute left-0 top-full z-[80] mt-2 max-h-60 min-w-full overflow-y-auto overflow-x-hidden rounded-xl border border-line/10 bg-[#101013]/95 py-1.5 shadow-[0_16px_50px_-12px_rgba(0,0,0,0.75)] backdrop-blur-md animate-silk-reveal"
        >
          {years.map((y) => {
            const selected = y === value;
            return (
              <li key={y} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => {
                    onSelect(y);
                    setOpen(false);
                  }}
                  className={[
                    'flex w-full px-4 py-2.5 text-left text-sm sm:text-base tabular-nums',
                    'transition-colors duration-150',
                    selected
                      ? 'bg-violet-600/25 text-violet-100 font-semibold'
                      : 'text-fg-muted hover:bg-line/[0.06] active:scale-[0.99]',
                  ].join(' ')}
                >
                  {y}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

export function SeasonFilter({ currentYear, currentSeason }: SeasonFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const availableYears = getAvailableYears();

  const updateFilters = (year: number, season: Season) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('year', year.toString());
    params.set('season', season);

    startTransition(() => {
      router.push(`/browse?${params.toString()}`);
    });
  };

  return (
    <div className="flex flex-wrap items-end gap-3 sm:gap-6 overflow-visible pb-2">
      <YearMenu
        value={currentYear}
        years={availableYears}
        onSelect={(year) => updateFilters(year, currentSeason)}
      />

      <div className="min-w-0 max-w-full sm:max-w-none sm:flex-shrink-0">
        <span className="block text-xs sm:text-sm font-medium text-fg-muted mb-1 sm:mb-2">Season</span>
        <div className="flex w-max max-w-full gap-1.5 overflow-x-auto overflow-y-visible pb-1 sm:max-w-none sm:overflow-visible sm:pb-0 scrollbar-hide">
          {SEASONS.map((season) => (
            <button
              key={season}
              type="button"
              onClick={() => updateFilters(currentYear, season)}
              className={`min-h-11 shrink-0 px-3 sm:px-6 py-2 sm:py-3 rounded-lg border font-medium transition-all text-sm sm:text-base whitespace-nowrap active:scale-95 ${
                currentSeason === season
                  ? 'bg-violet-600 text-white border-violet-400/50 shadow-lg shadow-violet-500/30'
                  : 'bg-line/[0.04] text-fg-muted border-line/10 hover:text-fg hover:border-line/20'
              }`}
            >
              {SEASON_LABELS[season]}
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}
