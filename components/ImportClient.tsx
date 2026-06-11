'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Download, Loader2, CheckCircle2, Upload } from 'lucide-react';
import { fetchAniListUserList, resolveMalIds } from '@/lib/anilist';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { useTracking } from '@/context/TrackingContext';

type Phase = 'idle' | 'loading' | 'done';
type Mode = 'anilist' | 'mal';

const MAL_STATUS: Record<string, string> = {
  Watching: 'watching',
  Completed: 'completed',
  'On-Hold': 'paused',
  Dropped: 'dropped',
  'Plan to Watch': 'planning',
};

async function postImport(entries: unknown[]) {
  const res = await fetch('/api/tracking/import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ entries, merge: 'furthest' }),
  });
  if (!res.ok) throw new Error();
  return res.json();
}

export function ImportClient() {
  const { refresh } = useTracking();
  const [mode, setMode] = useState<Mode>('anilist');
  const [username, setUsername] = useState('');
  const [phase, setPhase] = useState<Phase>('idle');
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [importedCount, setImportedCount] = useState(0);
  const [unmatched, setUnmatched] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setSignedIn(false);
      return;
    }
    createClient()
      .auth.getUser()
      .then(({ data: { user } }) => setSignedIn(!!user));
  }, []);

  const finish = (imported: number, missed: number) => {
    setImportedCount(imported);
    setUnmatched(missed);
    setPhase('done');
    refresh();
    toast.success(`Imported ${imported} titles`);
  };

  const handleAniList = async () => {
    const name = username.trim();
    if (!name) return;
    setPhase('loading');
    try {
      const entries = await fetchAniListUserList(name);
      if (entries.length === 0) {
        toast.error('No anime found — check the username, and that the list is public.');
        setPhase('idle');
        return;
      }
      const data = await postImport(entries);
      finish(data.imported ?? entries.length, 0);
    } catch {
      toast.error('Import failed. Please try again.');
      setPhase('idle');
    }
  };

  const handleMalFile = async (file: File) => {
    setPhase('loading');
    try {
      const text = await file.text();
      const doc = new DOMParser().parseFromString(text, 'application/xml');
      const raw: { malId: number; status: string; progress: number }[] = [];
      for (const el of Array.from(doc.getElementsByTagName('anime'))) {
        const malId = parseInt(
          el.getElementsByTagName('series_animedb_id')[0]?.textContent ?? '',
          10,
        );
        const status = MAL_STATUS[el.getElementsByTagName('my_status')[0]?.textContent ?? ''];
        const progress =
          parseInt(el.getElementsByTagName('my_watched_episodes')[0]?.textContent ?? '0', 10) || 0;
        if (!Number.isNaN(malId) && status) raw.push({ malId, status, progress });
      }
      if (raw.length === 0) {
        toast.error('No anime found in that file. Is it a MAL anime export?');
        setPhase('idle');
        return;
      }

      const malMap = await resolveMalIds(raw.map((r) => r.malId));
      const entries = raw.flatMap((r) => {
        const resolved = malMap.get(r.malId);
        if (!resolved) return [];
        return [
          {
            animeId: resolved.id,
            status: r.status,
            progress: r.progress,
            totalEpisodes: resolved.episodes ?? undefined,
          },
        ];
      });

      if (entries.length === 0) {
        toast.error('Could not match any titles to AniList.');
        setPhase('idle');
        return;
      }

      const data = await postImport(entries);
      finish(data.imported ?? entries.length, raw.length - entries.length);
    } catch {
      toast.error('Import failed. Please try again.');
      setPhase('idle');
    }
  };

  if (signedIn === false) {
    return (
      <div className="rounded-2xl border border-line/10 bg-line/[0.03] p-6 text-center">
        <p className="text-fg-muted">You need to be signed in to import a list.</p>
        <Link
          href="/login?redirect=/import"
          className="mt-4 inline-flex rounded-full bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-500 transition-colors"
        >
          Sign in
        </Link>
      </div>
    );
  }

  if (phase === 'done') {
    return (
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] p-6 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-400" />
        <p className="mt-3 text-lg font-semibold text-fg">Imported {importedCount} titles</p>
        <p className="mt-1 text-sm text-fg-muted">
          Your list and progress are now in ANNIE.
          {unmatched > 0 ? ` ${unmatched} couldn’t be matched to AniList.` : ''}
        </p>
        <Link
          href="/profile"
          className="mt-4 inline-flex rounded-full bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-500 transition-colors"
        >
          View your list
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-line/10 bg-line/[0.03] p-5 sm:p-6">
      {/* Source tabs */}
      <div className="mb-5 flex gap-2">
        {(['anilist', 'mal'] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            disabled={phase === 'loading'}
            className={`rounded-full px-4 py-1.5 text-sm font-medium border transition-colors ${
              mode === m
                ? 'bg-violet-600 border-violet-400/50 text-white'
                : 'bg-line/[0.04] border-line/10 text-fg-muted hover:text-fg'
            }`}
          >
            {m === 'anilist' ? 'AniList' : 'MyAnimeList'}
          </button>
        ))}
      </div>

      {mode === 'anilist' ? (
        <>
          <label htmlFor="al-username" className="block text-sm font-medium text-fg mb-2">
            AniList username
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              id="al-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && phase === 'idle' && handleAniList()}
              placeholder="e.g. yourname"
              disabled={phase === 'loading'}
              className="flex-1 rounded-xl border border-line/10 bg-line/[0.04] px-4 py-3 text-fg placeholder-fg-muted focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 disabled:opacity-60"
            />
            <button
              type="button"
              onClick={handleAniList}
              disabled={phase === 'loading' || !username.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-50 transition-colors active:scale-95"
            >
              {phase === 'loading' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Importing…
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Import
                </>
              )}
            </button>
          </div>
          <p className="mt-3 text-xs text-fg-muted leading-relaxed">
            Pulls your anime list and episode progress from a <strong>public</strong> AniList
            profile. Re-importing never lowers your progress.
          </p>
        </>
      ) : (
        <>
          <p className="block text-sm font-medium text-fg mb-2">MyAnimeList export file</p>
          <input
            ref={fileRef}
            type="file"
            accept=".xml,application/xml,text/xml"
            disabled={phase === 'loading'}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleMalFile(f);
            }}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={phase === 'loading'}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-50 transition-colors active:scale-95"
          >
            {phase === 'loading' ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Importing…
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Choose .xml file
              </>
            )}
          </button>
          <div className="mt-3 text-xs text-fg-muted leading-relaxed space-y-1">
            <p>
              Export from MyAnimeList → <strong>myanimelist.net/panel.php?go=export</strong> → choose
              Anime → download, then <strong>unzip</strong> the <code>.xml.gz</code> to a{' '}
              <code>.xml</code> and upload it here.
            </p>
            <p>Titles are matched to AniList by ID; re-importing never lowers your progress.</p>
          </div>
        </>
      )}
    </div>
  );
}
