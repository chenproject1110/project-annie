'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  Play,
  CheckCircle,
  Bookmark,
  XCircle,
  Pause,
  type LucideIcon,
} from 'lucide-react';
import {
  createClient as createSupabaseClient,
  isSupabaseConfigured,
} from '@/lib/supabase/client';
import type { TrackingStatus } from '@/components/AnimeTrackingButtons';

export type { TrackingStatus };

export interface TrackingBadgeConfig {
  label: string;
  icon: LucideIcon;
  bg: string;
  border: string;
}

export const TRACKING_BADGE: Record<TrackingStatus, TrackingBadgeConfig> = {
  watching: { label: 'Watching', icon: Play, bg: 'bg-cyan-600/80', border: 'border-cyan-400/40' },
  completed: { label: 'Completed', icon: CheckCircle, bg: 'bg-emerald-600/80', border: 'border-emerald-400/40' },
  planning: { label: 'Planning', icon: Bookmark, bg: 'bg-blue-600/80', border: 'border-blue-400/40' },
  dropped: { label: 'Dropped', icon: XCircle, bg: 'bg-red-600/80', border: 'border-red-400/40' },
  paused: { label: 'Paused', icon: Pause, bg: 'bg-amber-600/80', border: 'border-amber-400/40' },
};

interface TrackingContextValue {
  trackingMap: Record<number, TrackingStatus>;
  refresh: () => void;
}

const TrackingContext = createContext<TrackingContextValue>({
  trackingMap: {},
  refresh: () => {},
});

export function TrackingProvider({ children }: { children: ReactNode }) {
  const [trackingMap, setTrackingMap] = useState<Record<number, TrackingStatus>>({});
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    let cancelled = false;

    (async () => {
      try {
        const supabase = createSupabaseClient();
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user || cancelled) return;

        const { data: rows } = await supabase
          .from('anime_tracking')
          .select('anime_id, status')
          .eq('user_id', userData.user.id);

        if (cancelled || !rows) return;
        const map: Record<number, TrackingStatus> = {};
        for (const row of rows) {
          map[row.anime_id] = row.status as TrackingStatus;
        }
        setTrackingMap(map);
      } catch {
        // non-critical — badges simply won't appear
      }
    })();

    return () => { cancelled = true; };
  }, [refreshKey]);

  const value = useMemo(() => ({ trackingMap, refresh }), [trackingMap, refresh]);

  return (
    <TrackingContext.Provider value={value}>
      {children}
    </TrackingContext.Provider>
  );
}

export function useTracking() {
  return useContext(TrackingContext);
}

export function useTrackingStatus(animeId: number): TrackingStatus | null {
  const { trackingMap } = useContext(TrackingContext);
  return trackingMap[animeId] ?? null;
}
