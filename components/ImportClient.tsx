'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Download, Loader2, CheckCircle2 } from 'lucide-react';
import { fetchAniListUserList } from '@/lib/anilist';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { useTracking } from '@/context/TrackingContext';

type Phase = 'idle' | 'loading' | 'done';

export function ImportClient() {
  const { refresh } = useTracking();
  const [username, setUsername] = useState('');
  const [phase, setPhase] = useState<Phase>('idle');
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [importedCount, setImportedCount] = useState(0);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setSignedIn(false);
      return;
    }
    createClient()
      .auth.getUser()
      .then(({ data: { user } }) => setSignedIn(!!user));
  }, []);

  const handleImport = async () => {
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

      const res = await fetch('/api/tracking/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();

      setImportedCount(data.imported ?? entries.length);
      setPhase('done');
      refresh();
      toast.success(`Imported ${data.imported ?? entries.length} titles`);
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
        <p className="mt-3 text-lg font-semibold text-white">
          Imported {importedCount} titles
        </p>
        <p className="mt-1 text-sm text-fg-muted">Your list and progress are now in ANNIE.</p>
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
      <label htmlFor="al-username" className="block text-sm font-medium text-fg-muted mb-2">
        AniList username
      </label>
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          id="al-username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && phase === 'idle' && handleImport()}
          placeholder="e.g. yourname"
          disabled={phase === 'loading'}
          className="flex-1 rounded-xl border border-line/10 bg-line/[0.04] px-4 py-3 text-fg placeholder-fg-muted focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 disabled:opacity-60"
        />
        <button
          type="button"
          onClick={handleImport}
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
        Pulls your anime list and episode progress from a <strong>public</strong> AniList profile.
        Matching titles already in your list are updated. Nothing on AniList is changed.
      </p>
    </div>
  );
}
