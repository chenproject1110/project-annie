import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ArrowLeft, Building2 } from 'lucide-react';
import { fetchStudioDetail } from '@/lib/anilist-studio';

interface PageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const id = parseInt(params.id, 10);
  if (Number.isNaN(id)) return { title: 'Studio Not Found' };
  try {
    const s = await fetchStudioDetail(id);
    return { title: `${s.name} — PROJECT ANNIE`, description: `Anime by ${s.name}.` };
  } catch {
    return { title: 'Studio Not Found' };
  }
}

function formatLabel(format: string | null): string | null {
  if (!format) return null;
  const map: Record<string, string> = {
    TV: 'TV',
    TV_SHORT: 'TV Short',
    MOVIE: 'Movie',
    OVA: 'OVA',
    ONA: 'ONA',
    SPECIAL: 'Special',
    MUSIC: 'Music',
  };
  return map[format] ?? format;
}

export default async function StudioPage({ params }: PageProps) {
  const id = parseInt(params.id, 10);
  if (Number.isNaN(id)) notFound();

  let studio;
  try {
    studio = await fetchStudioDetail(id);
  } catch {
    notFound();
  }

  return (
    <main className="min-h-screen bg-bg">
      <div className="mx-auto max-w-7xl px-8 py-6 sm:py-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-fg-muted hover:text-fg mb-6 transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Home
        </Link>

        <header className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-violet-600/15 ring-1 ring-violet-500/30">
            <Building2 className="h-8 w-8 text-violet-300" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-violet-400 text-xs font-semibold uppercase tracking-wide mb-1">
              Studio
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-fg tracking-tight">{studio.name}</h1>
            <p className="text-sm text-fg-muted mt-1">{studio.works.length} works</p>
          </div>
        </header>

        <section className="mt-10">
          {studio.works.length === 0 ? (
            <p className="text-fg-muted text-sm">No anime found for this studio.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
              {studio.works.map((w) => {
                const title = w.title.english || w.title.romaji;
                return (
                  <Link
                    key={w.mediaId}
                    href={`/anime/${w.mediaId}`}
                    className="group flex flex-col rounded-xl overflow-hidden bg-surface shadow-lg hover:shadow-2xl transition-all duration-300 md:hover:scale-105 active:scale-95 md:active:scale-100"
                  >
                    <div className="relative w-full aspect-[2/3] overflow-hidden">
                      {w.cover ? (
                        <Image
                          src={w.cover}
                          alt={title}
                          fill
                          sizes="(max-width: 640px) 42vw, 168px"
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-surface-2">
                          <span className="text-xs text-fg-muted">No Image</span>
                        </div>
                      )}
                      {w.year != null && (
                        <span className="absolute top-2 right-2 rounded-md bg-black/70 backdrop-blur-sm px-1.5 py-0.5 text-[10px] font-semibold text-white">
                          {w.year}
                        </span>
                      )}
                    </div>
                    <div className="p-2 sm:p-3">
                      <p className="text-xs sm:text-sm font-medium text-fg line-clamp-2 leading-tight">
                        {title}
                      </p>
                      {formatLabel(w.format) && (
                        <p className="mt-0.5 text-[11px] text-fg-muted">{formatLabel(w.format)}</p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
