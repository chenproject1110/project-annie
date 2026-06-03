'use client';

/**
 * Thin "episodes watched" bar pinned to the bottom edge of a cover image.
 * Renders nothing unless there is real progress to show. Meant to live inside
 * a `relative` cover container (e.g. AnimeCard / TrackedAnimeCard).
 */
export function CoverProgressBar({
  progress,
  total,
}: {
  progress: number;
  total: number | null;
}) {
  if (!progress || progress <= 0) return null;

  const hasTotal = total != null && total > 0;
  const pct = hasTotal ? Math.min(100, Math.round((progress / (total as number)) * 100)) : 100;
  const complete = hasTotal && progress >= (total as number);

  return (
    <div
      className="absolute inset-x-0 bottom-0 z-[4] h-1 bg-black/50"
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={hasTotal ? (total as number) : undefined}
      aria-label={`${progress}${hasTotal ? ` of ${total}` : ''} episodes watched`}
    >
      <div
        className={`h-full transition-[width] duration-300 ${
          complete ? 'bg-emerald-400' : 'bg-violet-500'
        }`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
