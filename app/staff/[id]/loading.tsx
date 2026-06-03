export default function StaffLoading() {
  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      <div className="mx-auto max-w-7xl px-8 py-6 sm:py-10">
        <div className="h-4 w-20 rounded bg-white/5 animate-pulse mb-6" />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-7">
          <div className="h-32 w-32 sm:h-40 sm:w-40 shrink-0 rounded-2xl bg-white/10 animate-pulse ring-2 ring-white/10" />
          <div className="flex-1 space-y-3">
            <div className="h-4 w-24 rounded bg-white/5 animate-pulse" />
            <div className="h-9 w-64 max-w-full rounded-lg bg-white/10 animate-pulse" />
            <div className="h-5 w-40 rounded bg-white/5 animate-pulse" />
            <div className="flex gap-2">
              <div className="h-6 w-20 rounded-full bg-white/5 animate-pulse" />
              <div className="h-6 w-24 rounded-full bg-white/5 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Works grid */}
        <div className="mt-10">
          <div className="h-7 w-40 rounded-md bg-white/10 animate-pulse mb-5" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="aspect-[2/3] rounded-xl bg-white/5 animate-pulse" />
                <div className="h-3 w-full rounded bg-white/5 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
