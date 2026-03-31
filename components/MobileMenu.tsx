'use client';

import Link from 'next/link';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Logo } from '@/components/Logo';

export interface JapandiNavLink {
  href: string;
  label: string;
}

export interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
  pathname: string;
  links: readonly JapandiNavLink[];
}

function CloseMenuIcon({ open }: { open: boolean }) {
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

export function MobileMenu({ open, onClose, pathname, links }: MobileMenuProps) {
  const reduceMotion = useReducedMotion();

  const backdropTransition = reduceMotion
    ? { duration: 0.15 }
    : { duration: 0.32, ease: [0.22, 1, 0.36, 1] as const };
  const panelTransition = reduceMotion
    ? { duration: 0.2 }
    : { type: 'tween' as const, duration: 0.38, ease: [0.22, 1, 0.36, 1] as const };

  return (
    <AnimatePresence>
      {open && (
        <motion.button
          key="mobile-nav-backdrop"
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-xl sm:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={backdropTransition}
          onClick={onClose}
        />
      )}
      {open && (
        <motion.aside
          key="mobile-nav-panel"
          id="nav-mobile-sheet"
          role="dialog"
          aria-modal="true"
          aria-label="Site menu"
          className="fixed right-0 top-0 z-[201] flex h-full w-[min(100%,20rem)] flex-col border-l border-white/10 bg-black/70 backdrop-blur-xl shadow-[-12px_0_40px_rgba(0,0,0,0.5)] sm:hidden"
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={panelTransition}
        >
          <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
            <Link
              href="/"
              className="flex items-center gap-2 min-h-11 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
              onClick={onClose}
            >
              <Logo showText={false} className="scale-90" />
              <span className="mt-[4px] font-bold text-sm text-white tracking-tight leading-none">
                PROJECT <span className="text-violet-400">ANNIE</span>
              </span>
            </Link>
            <button
              type="button"
              className="min-h-11 min-w-11 inline-flex items-center justify-center rounded-xl text-gray-200 hover:bg-white/10 border border-white/10"
              aria-label="Close menu"
              onClick={onClose}
            >
              <CloseMenuIcon open />
            </button>
          </div>

          <nav className="flex flex-1 flex-col gap-2 p-4" aria-label="Mobile">
            {links.map(({ href, label }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={onClose}
                  className={`relative flex min-h-[3.25rem] items-center rounded-2xl border px-5 text-lg font-semibold transition-colors active:scale-[0.99] ${
                    active
                      ? 'border-violet-500/50 bg-violet-500/10 text-white'
                      : 'border-white/10 bg-white/[0.04] text-gray-100 hover:bg-white/[0.08]'
                  }`}
                >
                  {active && (
                    <span
                      className="absolute left-0 top-1/2 h-10 w-1 -translate-y-1/2 rounded-r-full bg-violet-500 shadow-[0_0_12px_rgba(139,92,246,0.6)]"
                      aria-hidden
                    />
                  )}
                  <span className={active ? 'pl-2' : ''}>{label}</span>
                </Link>
              );
            })}
          </nav>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
