'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Home, Compass, Search, User, LogIn, type LucideIcon } from 'lucide-react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';

interface Tab {
  href: string;
  label: string;
  icon: LucideIcon;
  isActive: (pathname: string) => boolean;
}

const BASE_TABS: Tab[] = [
  { href: '/', label: 'Home', icon: Home, isActive: (p) => p === '/' },
  { href: '/browse', label: 'Browse', icon: Compass, isActive: (p) => p.startsWith('/browse') },
  {
    href: '/search',
    label: 'Search',
    icon: Search,
    isActive: (p) => p.startsWith('/search'),
  },
];

export function BottomNav() {
  const pathname = usePathname();
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setSignedIn(false);
      return;
    }
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => setSignedIn(!!user));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, session) => setSignedIn(!!session?.user));
    return () => subscription.unsubscribe();
  }, []);

  const accountTab: Tab = signedIn
    ? { href: '/profile', label: 'You', icon: User, isActive: (p) => p.startsWith('/profile') }
    : { href: '/login', label: 'Sign in', icon: LogIn, isActive: (p) => p.startsWith('/login') };

  const tabs = [...BASE_TABS, accountTab];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-[90] sm:hidden border-t border-white/10 bg-black/70 backdrop-blur-xl pb-[env(safe-area-inset-bottom,0px)]"
      aria-label="Primary"
    >
      <ul className="flex items-stretch">
        {tabs.map(({ href, label, icon: Icon, isActive }) => {
          const active = isActive(pathname);
          return (
            <li key={label} className="flex-1">
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`flex h-14 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors active:scale-95 ${
                  active ? 'text-violet-400' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
