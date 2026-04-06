export default function AnimeDetailLoading() {
  return (
    <main className="relative z-0 min-h-screen bg-[#0a0a0a] -mt-[calc(max(0.75rem,env(safe-area-inset-top,0px))+4rem)] sm:-mt-[calc(max(1rem,env(safe-area-inset-top,0px))+4.5rem)]">
      <div className="relative">
        <div className="relative h-[220px] sm:h-[320px] md:h-[420px] w-full overflow-hidden bg-[#141414] animate-pulse" />

        <div className="absolute bottom-[10px] left-0 right-0 pb-4 sm:pb-8">
          <div className="mx-auto max-w-7xl px-8 space-y-3">
            <div className="h-8 sm:h-10 md:h-12 w-[min(90%,28rem)] rounded-lg bg-white/10 animate-pulse" />
            <div className="h-5 w-48 rounded-md bg-white/5 animate-pulse" />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-8 py-4 sm:py-8">
        <div className="flex flex-col lg:grid lg:grid-cols-[300px_1fr] xl:grid-cols-[350px_1fr] gap-4 sm:gap-6 lg:gap-8">
          <div className="space-y-4 sm:space-y-6 order-1">
            <div className="relative aspect-[2/3] w-full sm:w-64 mx-auto lg:w-full rounded-lg sm:rounded-xl bg-white/10 animate-pulse" />
            <div className="h-24 rounded-xl bg-white/5 animate-pulse hidden sm:block" />
          </div>
          <div className="space-y-4 order-2 flex-1 min-w-0">
            <div className="h-40 rounded-xl bg-white/5 animate-pulse" />
            <div className="h-56 rounded-xl bg-white/5 animate-pulse" />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="aspect-[2/3] rounded-lg bg-white/5 animate-pulse"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
