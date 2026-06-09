import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ArrowLeft, User } from 'lucide-react';
import { fetchCharacterDetail } from '@/lib/anilist-character';

interface PageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const id = parseInt(params.id, 10);
  if (Number.isNaN(id)) return { title: 'Character Not Found' };
  try {
    const c = await fetchCharacterDetail(id);
    return { title: `${c.name.full} — PROJECT ANNIE`, description: `Appearances of ${c.name.full}.` };
  } catch {
    return { title: 'Character Not Found' };
  }
}

function formatRole(role: string | null): string | null {
  if (!role) return null;
  return role.charAt(0) + role.slice(1).toLowerCase();
}

export default async function CharacterPage({ params }: PageProps) {
  const id = parseInt(params.id, 10);
  if (Number.isNaN(id)) notFound();

  let character;
  try {
    character = await fetchCharacterDetail(id);
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

        <header className="flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-7">
          <div className="relative h-32 w-32 sm:h-40 sm:w-40 shrink-0 overflow-hidden rounded-2xl ring-2 ring-white/10 bg-surface">
            {character.image ? (
              <Image
                src={character.image}
                alt={character.name.full}
                fill
                sizes="160px"
                className="object-cover"
                priority
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <User className="h-10 w-10 text-fg-muted" />
              </div>
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 text-violet-400 text-xs font-semibold uppercase tracking-wide mb-1">
              <User className="h-3.5 w-3.5" />
              Character
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-fg tracking-tight">
              {character.name.full}
            </h1>
            {character.name.native && (
              <p className="text-lg text-fg-muted mt-1">{character.name.native}</p>
            )}
            <div className="mt-2 flex flex-wrap gap-2">
              {character.gender && (
                <span className="rounded-full bg-line/[0.06] border border-line/10 px-3 py-1 text-xs text-fg-muted">
                  {character.gender}
                </span>
              )}
              {character.age && (
                <span className="rounded-full bg-line/[0.06] border border-line/10 px-3 py-1 text-xs text-fg-muted">
                  Age {character.age}
                </span>
              )}
            </div>
          </div>
        </header>

        {character.description && (
          <p className="mt-6 max-w-3xl text-sm text-fg-muted leading-relaxed line-clamp-5 whitespace-pre-wrap">
            {character.description}
          </p>
        )}

        <section className="mt-10">
          <h2 className="text-xl sm:text-2xl font-bold text-fg mb-4 sm:mb-6">
            Appears in{' '}
            <span className="text-sm font-normal text-fg-muted">({character.works.length})</span>
          </h2>

          {character.works.length === 0 ? (
            <p className="text-fg-muted text-sm">No anime appearances found.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
              {character.works.map((w, i) => {
                const title = w.title.english || w.title.romaji;
                const role = formatRole(w.role);
                return (
                  <Link
                    key={`${w.mediaId}-${i}`}
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
                      {/* Voice actor avatar, bottom-right, with hover label */}
                      {w.vaName && (
                        <div className="absolute bottom-2 right-2 z-[3] flex items-center">
                          <div className="hidden md:block mr-2 max-w-0 overflow-hidden rounded-lg bg-black/80 backdrop-blur-sm opacity-0 translate-x-3 group-hover:max-w-[150px] group-hover:opacity-100 group-hover:translate-x-0 group-hover:px-2 group-hover:py-1 text-right transition-all duration-300 pointer-events-none">
                            <p className="text-xs font-semibold text-fg whitespace-nowrap">CV</p>
                            <p className="text-[10px] text-violet-300 whitespace-nowrap">{w.vaName}</p>
                          </div>
                          <div className="relative h-12 w-12 md:h-11 md:w-11 shrink-0 overflow-hidden rounded-full ring-2 ring-violet-500/60 shadow-lg bg-surface-2">
                            {w.vaImage ? (
                              <Image
                                src={w.vaImage}
                                alt={w.vaName}
                                fill
                                sizes="48px"
                                className="object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-[9px] text-fg-muted">
                                {w.vaName.charAt(0)}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="p-2 sm:p-3">
                      <p className="text-xs sm:text-sm font-medium text-fg line-clamp-2 leading-tight">
                        {title}
                      </p>
                      {role && <p className="mt-0.5 text-[11px] text-fg-muted">{role}</p>}
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
