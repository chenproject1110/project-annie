'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { AnimatedBurger } from '@/components/AnimatedBurger';
import { TitleLanguageSwitch } from '@/components/TitleLanguageSwitch';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import type { JapandiNavLink } from '@/components/MobileMenu';

const MobileMenu = dynamic(
  () => import('@/components/MobileMenu').then((m) => ({ default: m.MobileMenu })),
  { ssr: false, loading: () => null }
);

const links: readonly JapandiNavLink[] = [
  { href: '/', label: 'Home' },
  { href: '/browse', label: 'Browse' },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserEmail(user?.email ?? null);
      if (user) {
        supabase
          .from('profiles')
          .select('display_name')
          .eq('id', user.id)
          .single()
          .then(({ data }) => {
            setDisplayName(data?.display_name ?? null);
          });
      }
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email ?? null);
      if (!session?.user) setDisplayName(null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = useCallback(async () => {
    if (!isSupabaseConfigured()) return;
    const supabase = createClient();
    await supabase.auth.signOut();
    setUserEmail(null);
    setDisplayName(null);
    setOpen(false);
    router.push('/');
    router.refresh();
  }, [router]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-[100] px-8 pt-[max(0.75rem,env(safe-area-inset-top,0px))] sm:pt-[max(1rem,env(safe-area-inset-top,0px))] pb-1">
      <nav
        className="mx-auto max-w-7xl rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.45)]"
        aria-label="Main"
      >
        <div className="flex items-center justify-between gap-2 px-3 py-2 sm:gap-3 sm:px-5 sm:py-3">
          {/* Logo — icon only on mobile, icon + text on desktop */}
          <Link
            href="/"
            className="flex items-center gap-2 sm:gap-3 rounded-xl min-h-11 min-w-11 px-1 -ml-1 active:scale-95 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 shrink-0"
            onClick={() => setOpen(false)}
          >
            <Logo showText={false} className="scale-90 sm:scale-100 shrink-0" />
            <span className="hidden sm:inline mt-[4px] font-bold text-sm sm:text-base text-white tracking-tight leading-none">
              PROJECT <span className="text-violet-400">ANNIE</span>
            </span>
          </Link>

          {/* Desktop nav links + language switcher */}
          <div className="hidden sm:flex sm:flex-1 sm:justify-end items-center gap-2">
            <div className="flex items-center gap-1">
              {links.map(({ href, label }) => {
                const active = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`relative min-h-11 min-w-11 px-4 inline-flex items-center justify-center rounded-xl text-sm font-medium border active:scale-95 transition-all ${
                      active
                        ? 'text-white bg-violet-500/15 border-violet-500/50'
                        : 'text-gray-200 hover:text-white hover:bg-white/5 border-transparent hover:border-white/10'
                    }`}
                  >
                    {active && (
                      <span
                        className="absolute bottom-1.5 left-1/2 -translate-x-1/2 h-0.5 w-6 rounded-full bg-violet-500"
                        aria-hidden
                      />
                    )}
                    {label}
                  </Link>
                );
              })}
            </div>
            <TitleLanguageSwitch />

            {userEmail ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/profile"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-purple-900 text-white text-sm font-bold ring-1 ring-white/10 hover:ring-violet-500/50 transition-all"
                  aria-label="View profile"
                >
                  {(displayName || userEmail).charAt(0).toUpperCase()}
                </Link>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="min-h-9 min-w-9 inline-flex items-center justify-center rounded-xl text-gray-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-all"
                  aria-label="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="min-h-11 px-4 inline-flex items-center justify-center rounded-xl text-sm font-medium text-gray-200 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-all"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile: compact language switcher + burger */}
          <div className="flex sm:hidden items-center gap-2 shrink-0">
            <TitleLanguageSwitch compact />
            <button
              type="button"
              className="min-h-[48px] min-w-[48px] inline-flex items-center justify-center rounded-xl text-gray-200 hover:bg-violet-500/10 hover:shadow-[0_0_16px_rgba(139,92,246,0.3)] border border-white/10 active:scale-95 transition-all"
              aria-expanded={open}
              aria-controls="nav-mobile-sheet"
              aria-label={open ? 'Close menu' : 'Open menu'}
              onClick={() => setOpen((v) => !v)}
            >
              <AnimatedBurger isOpen={open} />
            </button>
          </div>
        </div>
      </nav>

      <MobileMenu
        open={open}
        onClose={() => setOpen(false)}
        pathname={pathname}
        links={links}
        userEmail={userEmail}
        displayName={displayName}
        onSignOut={handleSignOut}
      />
    </header>
  );
}
