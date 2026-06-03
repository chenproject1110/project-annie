export default function ProfileLoading() {
  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      <div className="mx-auto max-w-4xl px-4 sm:px-8 pt-12 sm:pt-16">
        <div className="flex justify-center mb-4">
          <div className="h-28 w-28 rounded-full bg-white/10 animate-pulse" />
        </div>
        <div className="mx-auto h-7 w-48 rounded-lg bg-white/10 animate-pulse" />
        <div className="mx-auto mt-2 h-4 w-40 rounded bg-white/5 animate-pulse" />

        {/* stat chips */}
        <div className="mt-10 flex gap-3 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 w-28 shrink-0 rounded-xl bg-white/[0.04] border border-white/10 animate-pulse" />
          ))}
        </div>

        {/* grid */}
        <div className="mt-10 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-[2/3] rounded-xl bg-white/[0.04] border border-white/5 animate-pulse" />
          ))}
        </div>
      </div>
    </main>
  );
}
