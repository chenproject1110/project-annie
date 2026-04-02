export default function AnimeDetailLoading() {
  return (
    <main className="relative z-0 min-h-screen bg-gray-950 -mt-[calc(max(0.75rem,env(safe-area-inset-top,0px))+4rem)] sm:-mt-[calc(max(1rem,env(safe-area-inset-top,0px))+4.5rem)]">
      {/* Hero Section Skeleton - Showing banner version */}
      <div className="relative">
        {/* Banner Placeholder */}
        <div className="relative h-[400px] w-full bg-gray-800 animate-pulse">
          <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/80 to-transparent" />
        </div>

        {/* Hero Content Skeleton */}
        <div className="absolute bottom-[10px] left-0 right-0 pb-8">
          <div className="container mx-auto px-6">
            {/* Back Button Skeleton */}
            <div className="h-6 w-32 bg-gray-700 rounded animate-pulse mb-6" />
            
            {/* Title Skeleton */}
            <div className="space-y-3 mb-4">
              <div className="h-12 bg-gray-700 rounded animate-pulse w-3/4 max-w-2xl" />
              <div className="h-8 bg-gray-700/70 rounded animate-pulse w-1/2 max-w-xl" />
              <div className="h-6 bg-gray-700/50 rounded animate-pulse w-2/5 max-w-lg" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-8">
          {/* Left Column - Cover & Links Skeleton */}
          <div className="space-y-6">
            {/* Cover Image Skeleton */}
            <div className="aspect-[2/3] rounded-xl bg-gray-800 animate-pulse ring-2 ring-gray-700" />

            {/* External Links Skeleton */}
            <div className="space-y-3">
              <div className="h-6 w-32 bg-gray-700 rounded animate-pulse mb-3" />
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-12 bg-gray-800 rounded-lg animate-pulse"
                />
              ))}
            </div>

            {/* Genres Skeleton */}
            <div>
              <div className="h-6 w-20 bg-gray-700 rounded animate-pulse mb-3" />
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="h-8 w-20 bg-violet-900/30 rounded-lg animate-pulse"
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Details Skeleton */}
          <div className="space-y-8">
            {/* Synopsis Section Skeleton */}
            <div>
              <div className="h-8 w-32 bg-gray-700 rounded animate-pulse mb-4" />
              <div className="space-y-3">
                <div className="h-4 bg-gray-700/70 rounded animate-pulse w-full" />
                <div className="h-4 bg-gray-700/70 rounded animate-pulse w-full" />
                <div className="h-4 bg-gray-700/70 rounded animate-pulse w-11/12" />
                <div className="h-4 bg-gray-700/70 rounded animate-pulse w-full" />
                <div className="h-4 bg-gray-700/70 rounded animate-pulse w-10/12" />
                <div className="h-4 bg-gray-700/70 rounded animate-pulse w-full" />
                <div className="h-4 bg-gray-700/70 rounded animate-pulse w-9/12" />
              </div>
            </div>

            {/* Information Grid Skeleton */}
            <div>
              <div className="h-8 w-40 bg-gray-700 rounded animate-pulse mb-4" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-4 bg-gray-800 rounded-lg"
                  >
                    <div className="w-5 h-5 bg-violet-900/50 rounded animate-pulse flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-16 bg-gray-700 rounded animate-pulse" />
                      <div className="h-4 w-32 bg-gray-600 rounded animate-pulse" />
                    </div>
                  </div>
                ))}

                {/* Theme Songs Skeleton */}
                <div className="flex items-start gap-3 p-4 bg-gray-800 rounded-lg md:col-span-2">
                  <div className="w-5 h-5 bg-violet-900/50 rounded animate-pulse flex-shrink-0" />
                  <div className="flex-1 space-y-3">
                    <div className="h-3 w-24 bg-gray-700 rounded animate-pulse" />
                    <div className="space-y-2">
                      <div className="h-3 w-16 bg-violet-900/30 rounded animate-pulse" />
                      <div className="h-4 w-full bg-gray-700/70 rounded animate-pulse" />
                      <div className="h-4 w-5/6 bg-gray-700/70 rounded animate-pulse" />
                    </div>
                    <div className="space-y-2 pt-2">
                      <div className="h-3 w-16 bg-violet-900/30 rounded animate-pulse" />
                      <div className="h-4 w-full bg-gray-700/70 rounded animate-pulse" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Relations Section Skeleton */}
            <div>
              <div className="h-8 w-40 bg-gray-700 rounded animate-pulse mb-4" />
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="space-y-2">
                    <div className="aspect-[2/3] bg-gray-800 rounded-lg animate-pulse" />
                    <div className="h-4 bg-gray-700 rounded animate-pulse w-full" />
                    <div className="h-3 bg-gray-700/70 rounded animate-pulse w-2/3" />
                  </div>
                ))}
              </div>
            </div>

            {/* Characters & Cast Section Skeleton */}
            <div>
              <div className="h-8 w-48 bg-gray-700 rounded animate-pulse mb-4" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700"
                  >
                    <div className="grid grid-cols-2 gap-0">
                      {/* Character Skeleton */}
                      <div className="flex flex-col items-center p-4">
                        <div className="relative w-20 h-20 rounded-full bg-violet-900/30 animate-pulse mb-3 ring-2 ring-violet-500/30" />
                        <div className="space-y-2 w-full">
                          <div className="h-4 bg-gray-700 rounded animate-pulse w-full" />
                          <div className="h-3 bg-gray-700/70 rounded animate-pulse w-3/4 mx-auto" />
                        </div>
                      </div>

                      {/* Voice Actor Skeleton */}
                      <div className="flex flex-col items-center p-4 border-l border-gray-700">
                        <div className="relative w-20 h-20 rounded-full bg-gray-700/50 animate-pulse mb-3 ring-2 ring-gray-600" />
                        <div className="space-y-2 w-full">
                          <div className="h-3 bg-gray-700/50 rounded animate-pulse w-8 mx-auto" />
                          <div className="h-4 bg-gray-600 rounded animate-pulse w-full" />
                          <div className="h-3 bg-gray-700/70 rounded animate-pulse w-3/4 mx-auto" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
