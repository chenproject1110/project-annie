'use client';

import Link from 'next/link';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

export interface JapandiNavLink {
  href: string;
  label: string;
}

export interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
  pathname: string;
  links: readonly JapandiNavLink[];
  userEmail?: string | null;
  displayName?: string | null;
  onSignOut?: () => void;
}

const BACKDROP_EASE = [0.22, 1, 0.36, 1] as const;

const panelVariants = {
  hidden: { x: '100%' },
  visible: {
    x: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 500,
      damping: 32,
      mass: 0.5,
      when: 'beforeChildren',
      staggerChildren: 0.03,
    },
  },
  exit: {
    x: '100%',
    transition: {
      type: 'tween' as const,
      duration: 0.28,
      ease: BACKDROP_EASE,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 380, damping: 28 },
  },
  exit: { opacity: 0, y: 8, transition: { duration: 0.12 } },
};

export function MobileMenu({ open, onClose, pathname, links, userEmail, displayName, onSignOut }: MobileMenuProps) {
  const reduceMotion = useReducedMotion();

  const backdropTransition = reduceMotion
    ? { duration: 0.15 }
    : { duration: 0.32, ease: BACKDROP_EASE };

  const reducedPanel = {
    hidden: { x: '100%' },
    visible: { x: 0, transition: { duration: 0.2 } },
    exit: { x: '100%', transition: { duration: 0.15 } },
  };
  const reducedItem = {
    hidden: { opacity: 1, y: 0 },
    visible: { opacity: 1, y: 0, transition: { duration: 0 } },
    exit: { opacity: 0, transition: { duration: 0.1 } },
  };

  const usedPanelVariants = reduceMotion ? reducedPanel : panelVariants;
  const usedItemVariants = reduceMotion ? reducedItem : itemVariants;

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
          variants={usedPanelVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <nav className="flex flex-1 flex-col gap-3 px-8 pt-8 pb-6" aria-label="Mobile">
            {/* Profile / sign-in card */}
            <motion.div variants={usedItemVariants}>
              {userEmail ? (
                <div className="flex flex-col gap-2">
                  <Link
                    href="/profile"
                    onClick={onClose}
                    className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 min-h-[3rem] text-left transition-colors hover:bg-white/[0.08] active:scale-[0.98]"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-purple-900 text-white text-sm font-bold">
                      {(displayName || userEmail).charAt(0).toUpperCase()}
                    </span>
                    <span className="flex flex-col leading-tight min-w-0">
                      <span className="text-sm font-semibold text-white truncate">{displayName || 'My Profile'}</span>
                      <span className="text-xs text-gray-400 truncate">{userEmail}</span>
                    </span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => { onSignOut?.(); }}
                    className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-left text-sm text-gray-400 transition-colors hover:bg-white/[0.08] hover:text-white active:scale-[0.98]"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Sign Out
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  onClick={onClose}
                  className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 min-h-[3rem] text-left transition-colors hover:bg-white/[0.08] active:scale-[0.98]"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-violet-400">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="12" cy="8" r="4" />
                      <path d="M20 21a8 8 0 0 0-16 0" />
                    </svg>
                  </span>
                  <span className="flex flex-col leading-tight">
                    <span className="text-sm font-semibold text-white">Sign In</span>
                    <span className="text-xs text-gray-400">Track &amp; sync your list</span>
                  </span>
                </Link>
              )}
            </motion.div>

            {/* Separator */}
            <motion.div
              className="h-px w-full bg-white/10"
              variants={usedItemVariants}
              aria-hidden="true"
            />

            {/* Navigation links */}
            {links.map(({ href, label }) => {
              const active = pathname === href;
              return (
                <motion.div key={href} variants={usedItemVariants}>
                  <Link
                    href={href}
                    onClick={onClose}
                    className={`relative flex min-h-[3rem] items-center rounded-2xl border px-5 text-lg font-semibold transition-colors active:scale-[0.98] py-3 ${
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
                </motion.div>
              );
            })}
          </nav>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
