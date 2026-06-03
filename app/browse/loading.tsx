export default function BrowseLoading() {
  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      <div className="mx-auto max-w-7xl px-8 py-4 sm:py-8">
        <div className="h-9 w-64 max-w-[80%] rounded-lg bg-white/10 animate-pulse" />
        <div className="mt-2 h-4 w-48 rounded bg-white/5 animate-pulse" />

        {/* filters row */}
        <div className="mt-6 h-11 w-full max-w-md rounded-full bg-white/[0.04] border border-white/10 animate-pulse" />
        <div className="mt-3 h-12 w-full rounded-2xl bg-white/[0.04] border border-white/10 animate-pulse" />

        {/* grid */}
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="aspect-[2/3] rounded-xl bg-white/[0.04] border border-white/5 animate-pulse" />
          ))}
        </div>
      </div>
    </main>
  );
}
