'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOut, Download, Sun, Moon } from 'lucide-react';
import { TitleLanguageSwitch } from '@/components/TitleLanguageSwitch';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { useTheme } from '@/context/ThemeContext';

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-fg">{label}</p>
        {hint && <p className="text-xs text-fg-muted mt-0.5">{hint}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

const pillClass =
  'inline-flex items-center gap-1.5 rounded-full border border-line/10 bg-line/[0.04] px-3 py-1.5 text-xs font-medium text-fg-muted hover:text-fg transition-colors';

export function SettingsClient() {
  const router = useRouter();
  const { theme, toggle } = useTheme();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    createClient()
      .auth.getUser()
      .then(({ data: { user } }) => setEmail(user?.email ?? null));
  }, []);

  const signOut = async () => {
    if (!isSupabaseConfigured()) return;
    await createClient().auth.signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <div className="divide-y divide-line/10 rounded-2xl border border-line/10 bg-line/[0.03] px-4 sm:px-5">
      <Row label="Appearance" hint={`Currently ${theme} mode`}>
        <button type="button" onClick={toggle} className={pillClass} aria-label="Toggle theme">
          {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          {theme === 'dark' ? 'Light' : 'Dark'}
        </button>
      </Row>

      <Row label="Title language" hint="How titles are shown across the app">
        <TitleLanguageSwitch />
      </Row>

      <Row label="Broadcast timezone" hint="Set on the weekly schedule (JST / Local)">
        <Link href="/" className="text-xs font-medium text-violet-300 hover:text-violet-200">
          Open schedule
        </Link>
      </Row>

      <Row label="Import list" hint="Bring your list in from AniList">
        <Link href="/import" className={pillClass}>
          <Download className="h-3.5 w-3.5" />
          Import
        </Link>
      </Row>

      {email && (
        <Row label="Account" hint={email}>
          <button type="button" onClick={signOut} className={pillClass}>
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </button>
        </Row>
      )}
    </div>
  );
}
