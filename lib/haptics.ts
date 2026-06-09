/**
 * Lightweight haptic feedback via the Web Vibration API.
 * No-ops silently on devices/browsers that don't support it (e.g. iOS Safari,
 * desktop), so it's always safe to call.
 */
function vibrate(pattern: number | number[]): void {
  if (typeof navigator === 'undefined') return;
  if (!('vibrate' in navigator)) return;
  try {
    navigator.vibrate(pattern);
  } catch {
    /* ignore */
  }
}

/** A single soft tap — for +1 / increment style actions. */
export const hapticLight = () => vibrate(10);

/** A slightly firmer tap — for toggles like status changes or favourite. */
export const hapticMedium = () => vibrate(18);

/** A short success buzz — for completing a show. */
export const hapticSuccess = () => vibrate([8, 30, 14]);
