export default function StudioLoading() {
  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      <div className="mx-auto max-w-7xl px-8 py-6 sm:py-10">
        <div className="h-4 w-20 rounded bg-white/5 animate-pulse mb-6" />
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 shrink-0 rounded-2xl bg-white/10 animate-pulse" />
          <div className="space-y-2">
            <div className="h-4 w-16 rounded bg-white/5 animate-pulse" />
            <div className="h-9 w-56 max-w-full rounded-lg bg-white/10 animate-pulse" />
          </div>
        </div>
        <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="aspect-[2/3] rounded-xl bg-white/5 animate-pulse" />
              <div className="h-3 w-full rounded bg-white/5 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
