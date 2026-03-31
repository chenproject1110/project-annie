'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { Logo } from '@/components/Logo';
import type { JapandiNavLink } from '@/components/MobileMenu';

const MobileMenu = dynamic(
  () => import('@/components/MobileMenu').then((m) => ({ default: m.MobileMenu })),
  { ssr: false, loading: () => null }
);

const links: readonly JapandiNavLink[] = [
  { href: '/', label: 'Home' },
  { href: '/browse', label: 'Browse' },
];

function MenuIcon({ open }: { open: boolean }) {
  const reduceMotion = useReducedMotion();
  const t = reduceMotion ? { duration: 0.15 } : { duration: 0.28, ease: [0.22, 1, 0.36, 1] as const };

  return (
    <div className="relative h-5 w-6" aria-hidden>
      <motion.span
        className="absolute left-0 top-[5px] block h-0.5 w-6 rounded-full bg-current"
        initial={false}
        animate={
          open
            ? { top: 10, rotate: 45, transition: t }
            : { top: 5, rotate: 0, transition: t }
        }
      />
      <motion.span
        className="absolute left-0 top-[15px] block h-0.5 w-6 rounded-full bg-current"
        initial={false}
        animate={
          open
            ? { top: 10, rotate: -45, transition: t }
            : { top: 15, rotate: 0, transition: t }
        }
      />
    </div>
  );
}

export function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

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
    <header className="sticky top-0 z-[100] px-4 md:px-8 pt-3 sm:pt-4 pb-1">
      <nav
        className="mx-auto max-w-7xl rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.45)]"
        aria-label="Main"
      >
        <div className="flex items-center justify-between gap-3 px-3 py-2 sm:px-5 sm:py-3">
          <Link
            href="/"
            className="flex items-center gap-2 sm:gap-3 rounded-xl min-h-11 min-w-11 px-1 -ml-1 active:scale-95 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
            onClick={() => setOpen(false)}
          >
            <Logo showText={false} className="scale-90 sm:scale-100 shrink-0" />
            <span className="mt-[4px] font-bold text-sm sm:text-base text-white tracking-tight leading-none">
              PROJECT <span className="text-violet-400">ANNIE</span>
            </span>
          </Link>

          <div className="hidden sm:flex items-center gap-1">
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

          <button
            type="button"
            className="sm:hidden min-h-11 min-w-11 inline-flex items-center justify-center rounded-xl text-gray-200 hover:bg-white/10 border border-white/10 active:scale-95 transition-colors"
            aria-expanded={open}
            aria-controls={open ? 'nav-mobile-sheet' : undefined}
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((v) => !v)}
          >
            <MenuIcon open={open} />
          </button>
        </div>
      </nav>

      <MobileMenu
        open={open}
        onClose={() => setOpen(false)}
        pathname={pathname}
        links={links}
      />
    </header>
  );
}
