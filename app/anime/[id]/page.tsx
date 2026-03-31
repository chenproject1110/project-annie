import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { ArrowLeft, ExternalLink, Calendar, Tv, Clock, Play, Radio, Music } from 'lucide-react';
import { fetchAnimeDetail, formatDateJST, filterExternalLinks, formatMediaFormat, formatMediaSource, formatBroadcastSchedule, formatTimeUntilAiring } from '@/lib/anilist-detail';
import { getStatusLabel, stripHtml } from '@/lib/anilist';
import { fetchAnimeThemes, formatThemeString } from '@/lib/jikan';
import { CharacterCard } from '@/components/CharacterCard';
import { RelationCard } from '@/components/RelationCard';

interface PageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const animeId = parseInt(params.id);
  
  if (isNaN(animeId)) {
    return {
      title: 'Anime Not Found',
    };
  }

  try {
    const anime = await fetchAnimeDetail(animeId);
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
  const animeId = parseInt(params.id);
  
  if (isNaN(animeId)) {
    notFound();
  }

  let anime;
  try {
    anime = await fetchAnimeDetail(animeId);
  } catch {
    notFound();
  }

  const title = anime.title.english || anime.title.romaji;
  const description = stripHtml(anime.description);
  
  // Find studio: prioritize animation studios, then any studio
  const animationStudio = anime.studios.nodes.find(s => s.isAnimationStudio);
  const mainStudio = animationStudio?.name || anime.studios.nodes[0]?.name || 'Unknown';
  
  // Get producer studios (non-animation studios)
  const producers = anime.studios.nodes
    .filter(s => !s.isAnimationStudio && s.name !== mainStudio)
    .map(s => s.name);
  const startDateJST = formatDateJST(anime.startDate);
  const endDateJST = anime.endDate.year ? formatDateJST(anime.endDate) : null;
  const filteredLinks = filterExternalLinks(anime.externalLinks);
  const broadcastSchedule = anime.nextAiringEpisode ? formatBroadcastSchedule(anime.nextAiringEpisode.airingAt) : null;
  const nextEpisodeInfo = anime.nextAiringEpisode ? formatTimeUntilAiring(anime.nextAiringEpisode.timeUntilAiring, anime.nextAiringEpisode.episode) : null;
  
  // Fetch theme songs from Jikan API (MyAnimeList)
  const themes = await fetchAnimeThemes(anime.idMal);

  return (
    <main className="min-h-screen bg-gray-950">
      {/* Hero Section with Banner */}
      {anime.bannerImage ? (
        // Hero with banner image
        <div className="relative">
          {/* Banner Image Background */}
          <div className="relative h-[200px] sm:h-[300px] md:h-[400px] w-full">
            <Image
              src={anime.bannerImage}
              alt={title}
              fill
              sizes="100vw"
              className="object-cover"
              priority
            />
            {/* Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/80 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-gray-950/90 via-transparent to-gray-950/90" />
          </div>

          {/* Hero Content */}
          <div className="absolute bottom-[10px] left-0 right-0 pb-4 sm:pb-8">
            <div className="container mx-auto px-4 sm:px-6">
              <Link
                href="/"
                className="hidden sm:inline-flex items-center gap-1.5 sm:gap-2 text-gray-300 hover:text-white mb-3 sm:mb-6 transition-colors text-sm sm:text-base"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                Back to Home
              </Link>
              
              <div className="flex flex-col sm:flex-row sm:items-end gap-2 mb-2 sm:mb-4">
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white drop-shadow-lg">
                  {title}
                </h1>
                {anime.status && (
                  <span className={`px-2.5 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold self-start sm:mb-2 ${
                    anime.status === 'RELEASING' ? 'bg-green-600 text-white' :
                    anime.status === 'FINISHED' ? 'bg-blue-600 text-white' :
                    'bg-violet-600 text-white'
                  }`}>
                    {getStatusLabel(anime.status)}
                  </span>
                )}
              </div>

              {anime.title.native && (
                <p className="text-base sm:text-lg md:text-xl text-gray-300 mb-1 sm:mb-2">{anime.title.native}</p>
              )}

              {anime.title.romaji !== title && (
                <p className="text-sm sm:text-base md:text-lg text-gray-400">{anime.title.romaji}</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        // Hero without banner image
        <div className="bg-gradient-to-b from-gray-900 to-gray-950 border-b border-gray-800">
          <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8">
            <Link
              href="/"
              className="hidden sm:inline-flex items-center gap-1.5 sm:gap-2 text-gray-300 hover:text-white mb-3 sm:mb-6 transition-colors text-sm sm:text-base"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              Back to Home
            </Link>
            
            <div className="flex flex-col sm:flex-row sm:items-end gap-2 mb-2 sm:mb-4">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white">
                {title}
              </h1>
              {anime.status && (
                <span className={`px-2.5 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold self-start sm:mb-2 ${
                  anime.status === 'RELEASING' ? 'bg-green-600 text-white' :
                  anime.status === 'FINISHED' ? 'bg-blue-600 text-white' :
                  'bg-violet-600 text-white'
                }`}>
                  {getStatusLabel(anime.status)}
                </span>
              )}
            </div>

            {anime.title.native && (
              <p className="text-base sm:text-lg md:text-xl text-gray-300 mb-1 sm:mb-2">{anime.title.native}</p>
            )}

            {anime.title.romaji !== title && (
              <p className="text-sm sm:text-base md:text-lg text-gray-400">{anime.title.romaji}</p>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8">
        <div className="flex flex-col lg:grid lg:grid-cols-[300px_1fr] xl:grid-cols-[350px_1fr] gap-4 sm:gap-6 lg:gap-8">
          {/* Left Column - Cover & Links */}
          <div className="space-y-4 sm:space-y-6 order-1">
            {/* Cover Image */}
            <div className="relative aspect-[2/3] w-full sm:w-64 mx-auto lg:w-full rounded-lg sm:rounded-xl overflow-hidden shadow-2xl ring-2 ring-gray-800">
              <Image
                src={anime.coverImage.extraLarge}
                alt={title}
                fill
                sizes="(max-width: 1024px) min(90vw, 20rem), 350px"
                className="object-cover"
                priority
              />
            </div>

            {/* External Links */}
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

            {/* Genres */}
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

          {/* Right Column - Details */}
          <div className="space-y-4 sm:space-y-6 lg:space-y-8 order-2">
            {/* Description */}
            {description && (
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">Synopsis</h2>
                <p className="text-sm sm:text-base text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {description}
                </p>
              </div>
            )}

            {/* Information Grid */}
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                {/* Format */}
                {anime.format && (
                  <div className="flex items-start gap-2.5 sm:gap-3 p-3 sm:p-4 bg-gray-800 rounded-lg">
                    <Tv className="w-4 h-4 sm:w-5 sm:h-5 text-violet-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-400 mb-1">Format</p>
                      <p className="text-white font-medium">{formatMediaFormat(anime.format)}</p>
                    </div>
                  </div>
                )}

                {/* Episodes */}
                {anime.episodes && (
                  <div className="flex items-start gap-2.5 sm:gap-3 p-3 sm:p-4 bg-gray-800 rounded-lg">
                    <Play className="w-4 h-4 sm:w-5 sm:h-5 text-violet-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm text-gray-400 mb-1">Episodes</p>
                      <p className="text-sm sm:text-base text-white font-medium">{anime.episodes}</p>
                    </div>
                  </div>
                )}

                {/* Duration */}
                {anime.duration && (
                  <div className="flex items-start gap-2.5 sm:gap-3 p-3 sm:p-4 bg-gray-800 rounded-lg">
                    <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-violet-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm text-gray-400 mb-1">Episode Duration</p>
                      <p className="text-sm sm:text-base text-white font-medium">{anime.duration} min</p>
                    </div>
                  </div>
                )}

                {/* Season */}
                {anime.season && anime.seasonYear && (
                  <div className="flex items-start gap-2.5 sm:gap-3 p-3 sm:p-4 bg-gray-800 rounded-lg">
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-violet-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm text-gray-400 mb-1">Season</p>
                      <p className="text-sm sm:text-base text-white font-medium">
                        {anime.season.charAt(0) + anime.season.slice(1).toLowerCase()} {anime.seasonYear}
                      </p>
                    </div>
                  </div>
                )}

                {/* Start Date (JST) */}
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

                {/* Source */}
                {anime.source && (
                  <div className="flex items-start gap-2.5 sm:gap-3 p-3 sm:p-4 bg-gray-800 rounded-lg">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 text-violet-500 mt-0.5 flex-shrink-0 flex items-center justify-center">
                      <span className="text-base sm:text-lg">📚</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm text-gray-400 mb-1">Source</p>
                      <p className="text-sm sm:text-base text-white font-medium">{formatMediaSource(anime.source)}</p>
                    </div>
                  </div>
                )}

                {/* Studio */}
                <div className="flex items-start gap-2.5 sm:gap-3 p-3 sm:p-4 bg-gray-800 rounded-lg">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 text-violet-500 mt-0.5 flex-shrink-0 flex items-center justify-center">
                    <span className="text-base sm:text-lg">🎬</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm text-gray-400 mb-1">Studio</p>
                    <p className="text-sm sm:text-base text-white font-medium">{mainStudio}</p>
                  </div>
                </div>

                {/* Producers */}
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

                {/* Broadcast Schedule */}
                {broadcastSchedule && (
                  <div className="flex items-start gap-2.5 sm:gap-3 p-3 sm:p-4 bg-violet-900/20 border border-violet-500/30 rounded-lg">
                    <Radio className="w-4 h-4 sm:w-5 sm:h-5 text-violet-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm text-violet-300 mb-1">Broadcast Schedule</p>
                      <p className="text-sm sm:text-base text-white font-medium mb-1">{broadcastSchedule}</p>
                      {nextEpisodeInfo && (
                        <p className="text-xs sm:text-sm text-violet-200">
                          {nextEpisodeInfo}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Theme Songs */}
                {themes && (themes.openings.length > 0 || themes.endings.length > 0) && (
                  <div className="flex items-start gap-2.5 sm:gap-3 p-3 sm:p-4 bg-gray-800 rounded-lg">
                    <Music className="w-4 h-4 sm:w-5 sm:h-5 text-violet-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm text-gray-400 mb-2 sm:mb-3">Theme Songs</p>
                      
                      {/* Opening Themes */}
                      {themes.openings.length > 0 && (
                        <div className="mb-4">
                          <p className="text-xs font-semibold text-violet-400 uppercase tracking-wide mb-2">
                            Opening{themes.openings.length > 1 ? 's' : ''}
                          </p>
                          <ul className="space-y-1.5">
                            {themes.openings.map((opening, index) => (
                              <li key={index} className="text-sm text-gray-200 leading-relaxed">
                                {formatThemeString(opening)}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Ending Themes */}
                      {themes.endings.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-violet-400 uppercase tracking-wide mb-2">
                            Ending{themes.endings.length > 1 ? 's' : ''}
                          </p>
                          <ul className="space-y-1.5">
                            {themes.endings.map((ending, index) => (
                              <li key={index} className="text-sm text-gray-200 leading-relaxed">
                                {formatThemeString(ending)}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Relations */}
            {anime.relations.edges.length > 0 && (
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">Related Anime</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                  {anime.relations.edges.slice(0, 10).map((relation, index) => (
                    <RelationCard key={index} relation={relation} />
                  ))}
                </div>
              </div>
            )}

            {/* Characters & Voice Actors */}
            {anime.characters.edges.length > 0 && (
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">Characters & Cast</h2>
                <div className="grid grid-cols-1 gap-3 sm:gap-4">
                  {anime.characters.edges.map((character, index) => (
                    <CharacterCard key={index} character={character} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
