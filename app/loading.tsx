export default function HomeLoading() {
  return (
    <main className="min-h-screen bg-bg">
      <div className="mx-auto max-w-7xl px-8 pt-2 pb-8">
        <div className="h-9 w-72 max-w-[80%] rounded-lg bg-line/10 animate-pulse" />
        <div className="mt-2 h-4 w-40 rounded bg-line/5 animate-pulse" />

        {/* day pills */}
        <div className="mt-6 h-12 w-full rounded-full bg-line/[0.04] border border-line/10 animate-pulse" />

        {/* grid */}
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[2/3] rounded-[32px] md:rounded-xl bg-line/[0.04] border border-line/5 animate-pulse"
            />
          ))}
        </div>
      </div>
    </main>
  );
}
