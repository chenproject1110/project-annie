import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { Suspense } from 'react';
import { ArrowLeft, ExternalLink, Calendar, Tv, Clock, Play, Radio } from 'lucide-react';
import {
  fetchAnimeDetail,
  formatDateJST,
  filterExternalLinks,
  formatMediaFormat,
  formatMediaSource,
} from '@/lib/anilist-detail';
import { getStatusLabel, stripHtml } from '@/lib/anilist';
import { CharacterCard } from '@/components/CharacterCard';
import { RelationCard } from '@/components/RelationCard';
import { AnimeTrackingButtons, type TrackingStatus } from '@/components/AnimeTrackingButtons';
import { EpisodeProgress } from '@/components/EpisodeProgress';
import { ThemeSongs, ThemeSongsSkeleton } from '@/components/ThemeSongs';
import { AnimeRecommendations } from '@/components/AnimeRecommendations';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/server';

interface PageProps {
  params: {
    id: string;
  };
}

function heroImageUrl(anime: { coverImage: { extraLarge: string } }): string {
  return anime.coverImage.extraLarge;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const id = parseInt(params.id, 10);

  if (Number.isNaN(id)) {
    return {
      title: 'Anime Not Found',
    };
  }

  try {
    const anime = await fetchAnimeDetail(id);
    const title = anime.title.english || anime.title.romaji;
    const description = stripHtml(anime.description);

    return {
      title: `${title} - PROJECT ANNIE`,
      description: description.substring(0, 160),
      openGraph: {
        title,
        description: description.substring(0, 160),
        images: [anime.coverImage.extraLarge],
      },
    };
  } catch {
    return {
      title: 'Anime Not Found',
    };
  }
}

export default async function AnimeDetailPage({ params }: PageProps) {
  const id = parseInt(params.id, 10);

  if (Number.isNaN(id)) {
    notFound();
  }

  let anime;
  try {
    anime = await fetchAnimeDetail(id);
  } catch {
    notFound();
  }

  const title = anime.title.english || anime.title.romaji;
  const description = stripHtml(anime.description);

  const animationStudio = anime.studios.nodes.find((s) => s.isAnimationStudio);
  const mainStudio = animationStudio?.name || anime.studios.nodes[0]?.name || 'Unknown';

  const producers = anime.studios.nodes
    .filter((s) => !s.isAnimationStudio && s.name !== mainStudio)
    .map((s) => s.name);
  const startDateJST = formatDateJST(anime.startDate);
  const endDateJST = anime.endDate.year ? formatDateJST(anime.endDate) : null;
  const filteredLinks = filterExternalLinks(anime.externalLinks);
  const showBroadcast =
    anime.status === 'RELEASING' && anime.broadcastSchedule && anime.broadcastSchedule.length > 0;

  const art = heroImageUrl(anime);
  const relationEdges = anime.relations.edges.filter((e) => e.node.coverImage.extraLarge);

  let user = null;
  let currentTrackingStatus: TrackingStatus | null = null;
  let currentProgress = 0;
  if (isSupabaseConfigured()) {
    const supabase = createClient();
    const { data } = await supabase.auth.getUser();
    user = data.user;
    if (user) {
      const { data: tracking } = await supabase
        .from('anime_tracking')
        .select('status, progress')
        .eq('user_id', user.id)
        .eq('anime_id', id)
        .single();
      if (tracking) {
        currentTrackingStatus = tracking.status as TrackingStatus;
        currentProgress = tracking.progress ?? 0;
      }
    }
  }

  const totalEpisodes = anime.episodes != null && anime.episodes > 0 ? anime.episodes : null;

  return (
    <main className="relative z-0 min-h-screen bg-[#0a0a0a] -mt-[calc(max(0.75rem,env(safe-area-inset-top,0px))+4rem)] sm:-mt-[calc(max(1rem,env(safe-area-inset-top,0px))+4.5rem)]">
      {/* Double-layer hero (global): blurred backdrop + sharp contain — no MAL banner asset */}
      <div className="relative">
        <div className="relative h-[350px] sm:h-[320px] md:h-[420px] w-full overflow-visible">
          <div className="absolute -top-20 sm:-top-20 inset-x-0 bottom-0 bg-[#0a0a0a]" aria-hidden>
            <Image
              src={art}
              alt=""
              fill
              sizes="100vw"
              className="object-cover object-center blur-3xl opacity-60"
              priority
            />
          </div>
          </div>

        <div className="absolute bottom-[10px] left-0 right-0 pb-4 sm:pb-8">
          <div className="mx-auto max-w-7xl px-8">
            <Link
              href="/"
              className="hidden sm:inline-flex items-center gap-1.5 sm:gap-2 text-gray-300 hover:text-white mb-3 sm:mb-6 transition-colors text-sm sm:text-base"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              Back to Home
            </Link>

            <div className="flex flex-col sm:flex-row sm:items-end gap-2 mb-2 sm:mb-4">
              <h1 className="text-xl min-[400px]:text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white drop-shadow-lg">
                {title}
              </h1>
              {anime.status && (
                <span
                  className={`px-2.5 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold self-start sm:mb-2 ${
                    anime.status === 'RELEASING'
                      ? 'bg-green-600 text-white'
                      : anime.status === 'FINISHED'
                        ? 'bg-blue-600 text-white'
                        : 'bg-violet-600 text-white'
                  }`}
                >
                  {getStatusLabel(anime.status)}
                </span>
              )}
            </div>

            {anime.title.native && (
              <p className="text-sm min-[350px]:text-base sm:text-lg md:text-xl text-gray-300 mb-1 sm:mb-2">
                {anime.title.native}
              </p>
            )}

            {anime.title.romaji !== title && (
              <p className="text-xs min-[350px]:text-sm sm:text-base md:text-lg text-gray-400">{anime.title.romaji}</p>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-8 py-4 sm:py-8">
        <div className="flex flex-col lg:grid lg:grid-cols-[300px_1fr] xl:grid-cols-[350px_1fr] gap-4 sm:gap-6 lg:gap-8">
          <div className="space-y-4 sm:space-y-6 order-1">
            <div className="relative aspect-[2/3] w-full sm:w-64 mx-auto lg:w-full rounded-lg sm:rounded-xl overflow-hidden shadow-2xl ring-2 ring-white/10">
              <Image
                src={anime.coverImage.extraLarge}
                alt={title}
                fill
                sizes="(max-width: 1024px) min(90vw, 20rem), 350px"
                className="object-cover"
                priority
              />
            </div>

            <AnimeTrackingButtons
              animeId={anime.id}
              animeTitle={anime.title.english || anime.title.romaji}
              animeTitleRomaji={anime.title.romaji}
              coverImageUrl={anime.coverImage.extraLarge}
              initialStatus={currentTrackingStatus}
              isAuthenticated={!!user}
            />

            {user && anime.format !== 'MOVIE' && (
              <EpisodeProgress
                animeId={anime.id}
                totalEpisodes={totalEpisodes}
                initialProgress={currentProgress}
                initialStatus={currentTrackingStatus}
                isAuthenticated={!!user}
              />
            )}

            {filteredLinks.length > 0 && (
              <div className="space-y-2 sm:space-y-3">
                <h3 className="text-base sm:text-lg font-bold text-white">External Links</h3>
                <div className="grid grid-cols-2 sm:grid-cols-1 gap-2 sm:gap-3">
                  {filteredLinks.map((link, index) => (
                    <a
                      key={index}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-800 hover:bg-violet-600 text-white rounded-lg transition-colors group text-sm sm:text-base"
                    >
                      <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform flex-shrink-0" />
                      <span className="font-medium truncate">{link.site}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {anime.genres.length > 0 && (
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white mb-2 sm:mb-3">Genres</h3>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {anime.genres.map((genre) => (
                    <span
                      key={genre}
                      className="px-2.5 sm:px-3 py-1 sm:py-1.5 bg-violet-600/90 text-white text-xs sm:text-sm font-medium rounded-lg"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4 sm:space-y-6 lg:space-y-8 order-2">
            {description && (
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">Synopsis</h2>
                <p className="text-sm sm:text-base text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {description}
                </p>
              </div>
            )}

            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                {anime.format && (
                  <div className="flex items-start gap-2.5 sm:gap-3 p-3 sm:p-4 bg-gray-800 rounded-lg">
                    <Tv className="w-4 h-4 sm:w-5 sm:h-5 text-violet-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-400 mb-1">Format</p>
                      <p className="text-white font-medium">{formatMediaFormat(anime.format)}</p>
                    </div>
                  </div>
                )}

                {anime.episodes != null && anime.episodes > 0 && (
                  <div className="flex items-start gap-2.5 sm:gap-3 p-3 sm:p-4 bg-gray-800 rounded-lg">
                    <Play className="w-4 h-4 sm:w-5 sm:h-5 text-violet-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm text-gray-400 mb-1">Episodes</p>
                      <p className="text-sm sm:text-base text-white font-medium">{anime.episodes}</p>
                    </div>
                  </div>
                )}

                {anime.duration && anime.duration !== 'Unknown' && (
                  <div className="flex items-start gap-2.5 sm:gap-3 p-3 sm:p-4 bg-gray-800 rounded-lg">
                    <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-violet-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm text-gray-400 mb-1">Episode Duration</p>
                      <p className="text-sm sm:text-base text-white font-medium">{anime.duration}</p>
                    </div>
                  </div>
                )}

                {anime.season && anime.seasonYear && (
                  <div className="flex items-start gap-2.5 sm:gap-3 p-3 sm:p-4 bg-gray-800 rounded-lg">
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-violet-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm text-gray-400 mb-1">Season</p>
                      <p className="text-sm sm:text-base text-white font-medium">
                        {anime.season.charAt(0) + anime.season.slice(1).toLowerCase()}{' '}
                        {anime.seasonYear}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-2.5 sm:gap-3 p-3 sm:p-4 bg-gray-800 rounded-lg">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-violet-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm text-gray-400 mb-1">Aired (JST)</p>
                    <p className="text-sm sm:text-base text-white font-medium">
                      {startDateJST}
                      {endDateJST && ` to ${endDateJST}`}
                    </p>
                  </div>
                </div>

                {anime.source && (
                  <div className="flex items-start gap-2.5 sm:gap-3 p-3 sm:p-4 bg-gray-800 rounded-lg">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 text-violet-500 mt-0.5 flex-shrink-0 flex items-center justify-center">
                      <span className="text-base sm:text-lg">📚</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm text-gray-400 mb-1">Source</p>
                      <p className="text-sm sm:text-base text-white font-medium">
                        {formatMediaSource(anime.source)}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-2.5 sm:gap-3 p-3 sm:p-4 bg-gray-800 rounded-lg">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 text-violet-500 mt-0.5 flex-shrink-0 flex items-center justify-center">
                    <span className="text-base sm:text-lg">🎬</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm text-gray-400 mb-1">Studio</p>
                    <p className="text-sm sm:text-base text-white font-medium">{mainStudio}</p>
                  </div>
                </div>

                {producers.length > 0 && (
                  <div className="flex items-start gap-2.5 sm:gap-3 p-3 sm:p-4 bg-gray-800 rounded-lg">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 text-violet-500 mt-0.5 flex-shrink-0 flex items-center justify-center">
                      <span className="text-base sm:text-lg">🎭</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm text-gray-400 mb-1">Producers</p>
                      <p className="text-sm sm:text-base text-white font-medium">
                        {producers.join(', ')}
                      </p>
                    </div>
                  </div>
                )}

                {showBroadcast && (
                  <div className="flex items-start gap-2.5 sm:gap-3 p-3 sm:p-4 bg-violet-900/20 border border-violet-500/30 rounded-lg">
                    <Radio className="w-4 h-4 sm:w-5 sm:h-5 text-violet-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm text-violet-300 mb-1">Broadcast Schedule</p>
                      <p className="text-sm sm:text-base text-white font-medium">
                        {anime.broadcastSchedule}
                      </p>
                    </div>
                  </div>
                )}

              </div>
            </div>

            <Suspense fallback={<ThemeSongsSkeleton />}>
              <ThemeSongs idMal={anime.idMal} />
            </Suspense>

            {relationEdges.length > 0 && (
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">
                  Related Anime
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                  {relationEdges.slice(0, 10).map((relation, index) => (
                    <RelationCard key={`${relation.node.id}-${index}`} relation={relation} />
                  ))}
                </div>
              </div>
            )}

            {anime.characters.edges.length > 0 && (
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">
                  Characters & Cast
                </h2>
                <div className="grid grid-cols-1 gap-3 sm:gap-4">
                  {anime.characters.edges.map((character, index) => (
                    <CharacterCard key={index} character={character} />
                  ))}
                </div>
              </div>
            )}

            <Suspense fallback={null}>
              <AnimeRecommendations animeId={anime.id} />
            </Suspense>
          </div>
        </div>
      </div>
    </main>
  );
}
