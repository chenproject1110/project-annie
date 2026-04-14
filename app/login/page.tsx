'use client';

import { Suspense, useState, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { toast } from 'sonner';
import { Lock, Mail } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { createClient } from '@/lib/supabase/client';

const SPRING = { type: 'spring', stiffness: 300, damping: 28 } as const;
const REDUCED = { duration: 0.15 } as const;

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/profile';
  const reduceMotion = useReducedMotion();
  const t = reduceMotion ? REDUCED : SPRING;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      toast.error('Invalid credentials');
      setLoading(false);
      return;
    }

    toast.success('Welcome back!');
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <main className="relative z-0 flex min-h-screen items-center justify-center bg-[#0a0a0a] px-4 -mt-[calc(max(0.75rem,env(safe-area-inset-top,0px))+4rem)] sm:-mt-[calc(max(1rem,env(safe-area-inset-top,0px))+4.5rem)] pt-[calc(max(0.75rem,env(safe-area-inset-top,0px))+4rem)] sm:pt-[calc(max(1rem,env(safe-area-inset-top,0px))+4.5rem)]">
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.08)_0%,transparent_70%)]"
        aria-hidden
      />

      <motion.form
        onSubmit={handleSubmit}
        variants={reduceMotion ? undefined : staggerContainer}
        initial="hidden"
        animate="show"
        className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.04] p-8 backdrop-blur-xl shadow-[0_8px_32px_rgba(139,92,246,0.15)]"
      >
        <motion.div variants={fadeUp} transition={t} className="mb-6 flex justify-center">
          <Logo />
        </motion.div>

        <motion.h1
          variants={fadeUp}
          transition={t}
          className="mb-6 text-center text-xl font-semibold text-white"
        >
          Sign in to your account
        </motion.h1>

        <motion.div variants={fadeUp} transition={t} className="mb-4">
          <label htmlFor="email" className="mb-1.5 block text-sm text-gray-400">
            Email
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/[0.06] py-2.5 pl-10 pr-3 text-sm text-white placeholder-gray-500 outline-none transition-colors focus:border-purple-500"
              placeholder="you@example.com"
            />
          </div>
        </motion.div>

        <motion.div variants={fadeUp} transition={t} className="mb-6">
          <label htmlFor="password" className="mb-1.5 block text-sm text-gray-400">
            Password
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/[0.06] py-2.5 pl-10 pr-3 text-sm text-white placeholder-gray-500 outline-none transition-colors focus:border-purple-500"
              placeholder="••••••••"
            />
          </div>
        </motion.div>

        <motion.div variants={fadeUp} transition={t}>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-violet-600 py-2.5 text-sm font-semibold text-white transition-all hover:bg-violet-500 active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </motion.div>
      </motion.form>
    </main>
  );
}
