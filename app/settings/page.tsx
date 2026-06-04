import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Settings as SettingsIcon } from 'lucide-react';
import { SettingsClient } from '@/components/SettingsClient';

export const metadata: Metadata = {
  title: 'Settings — PROJECT ANNIE',
};

export default function SettingsPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      <div className="mx-auto max-w-2xl px-6 sm:px-8 py-8 sm:py-12">
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Profile
        </Link>

        <div className="flex items-center gap-2 text-violet-400 text-xs font-semibold uppercase tracking-wide mb-1">
          <SettingsIcon className="h-3.5 w-3.5" />
          Settings
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-6">Settings</h1>

        <SettingsClient />
      </div>
    </main>
  );
}
