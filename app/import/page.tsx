import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Download } from 'lucide-react';
import { ImportClient } from '@/components/ImportClient';

export const metadata: Metadata = {
  title: 'Import your list — PROJECT ANNIE',
  description: 'Import your anime list from AniList.',
};

export default function ImportPage() {
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
          <Download className="h-3.5 w-3.5" />
          Import
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-2">
          Bring your list to ANNIE
        </h1>
        <p className="text-gray-400 text-sm sm:text-base mb-6">
          Already track on AniList? Import your list and episode progress in one step.
        </p>

        <ImportClient />
      </div>
    </main>
  );
}
