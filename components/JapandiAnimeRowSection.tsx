import Link from 'next/link';
import type { Anime } from '@/lib/anilist';
import { AnimeCard } from '@/components/AnimeCard';

export interface JapandiShowAllLinkProps {
  href: string;
  label: string;
  variant?: 'header' | 'mobile-wide';
}

export function JapandiShowAllLink({ href, label, variant = 'header' }: JapandiShowAllLinkProps) {
  const base =
    'inline-flex min-h-11 items-center justify-center font-semibold text-white bg-transparent border border-violet-500/90 hover:bg-violet-500/10 hover:border-violet-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a] active:scale-95 transition-all';
  if (variant === 'mobile-wide') {
    return (
      <Link
        href={href}
        className={`${base} w-full px-12 py-4 text-base rounded-[32px]`}
      >
        {label}
      </Link>
    );
  }
  return (
    <Link
      href={href}
      className={`${base} min-w-11 rounded-xl px-5 py-2.5 text-sm shrink-0`}
    >
      {label}
    </Link>
  );
}

export interface JapandiSectionHeaderProps {
  id?: string;
  title: string;
  subtitle: string;
  showAllHref: string;
  showAllLabel: string;
}

export function JapandiSectionHeader({
  id,
  title,
  subtitle,
  showAllHref,
  showAllLabel,
}: JapandiSectionHeaderProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-4 md:mb-6">
      <div>
        <h2 id={id} className="text-2xl md:text-4xl font-bold text-white tracking-tight">
          {title}
        </h2>
        <p className="text-gray-400 text-sm sm:text-base mt-1">{subtitle}</p>
      </div>
      <div className="hidden md:flex shrink-0">
        <JapandiShowAllLink href={showAllHref} label={showAllLabel} variant="header" />
      </div>
    </div>
  );
}

export interface JapandiSectionShowAllMobileProps {
  showAllHref: string;
  showAllLabel: string;
}

export function JapandiSectionShowAllMobile({
  showAllHref,
  showAllLabel,
}: JapandiSectionShowAllMobileProps) {
  return (
    <div className="mt-6 flex justify-center md:hidden w-full px-0">
      <JapandiShowAllLink href={showAllHref} label={showAllLabel} variant="mobile-wide" />
    </div>
  );
}

export interface JapandiAnimeRowSectionProps {
  sectionId: string;
  title: string;
  subtitle: string;
  showAllHref: string;
  showAllLabel: string;
  items: Anime[];
  emptyMessage: string;
  /** Bottom padding for section rhythm (e.g. tighter mid-page vs. looser before footer). */
  bottomSpacingClassName?: string;
}

export function JapandiAnimeRowSection({
  sectionId,
  title,
  subtitle,
  showAllHref,
  showAllLabel,
  items,
  emptyMessage,
  bottomSpacingClassName = 'pb-10 sm:pb-14',
}: JapandiAnimeRowSectionProps) {
  return (
    <section
      className={`mx-auto max-w-7xl px-8 ${bottomSpacingClassName}`}
      aria-labelledby={sectionId}
    >
      <JapandiSectionHeader
        id={sectionId}
        title={title}
        subtitle={subtitle}
        showAllHref={showAllHref}
        showAllLabel={showAllLabel}
      />

      {items.length === 0 ? (
        <p className="text-gray-500 text-sm">{emptyMessage}</p>
      ) : (
        <>
          <div className="flex flex-nowrap md:grid md:grid-cols-6 gap-[0.75rem] overflow-x-auto md:overflow-visible pb-3 scrollbar-hide snap-x snap-mandatory md:snap-none scroll-smooth">
            {items.map((anime) => (
              <div
                key={anime.mal_id}
                className="w-[42vw] max-w-[168px] shrink-0 snap-start md:w-auto md:max-w-none"
              >
                <AnimeCard anime={anime} />
              </div>
            ))}
          </div>
          <JapandiSectionShowAllMobile showAllHref={showAllHref} showAllLabel={showAllLabel} />
        </>
      )}
    </section>
  );
}
