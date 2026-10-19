export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div
      className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
      aria-busy="true"
      aria-live="polite"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-[2rem] border border-espresso/15 bg-white/70"
        >
          <div className="h-52 animate-pulse bg-caramel/20" />
          <div className="space-y-3 p-5">
            <div className="h-5 w-2/3 animate-pulse rounded bg-caramel/20" />
            <div className="h-4 w-1/3 animate-pulse rounded bg-caramel/20" />
            <div className="h-11 w-full animate-pulse rounded-full bg-caramel/20" />
          </div>
        </div>
      ))}
    </div>
  );
}
