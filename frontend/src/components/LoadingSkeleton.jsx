// Shimmer skeleton components
export function CardSkeleton() {
  return (
    <div className="flex-shrink-0 w-[150px] sm:w-[160px] md:w-[180px] rounded-xl overflow-hidden bg-cinema-card border border-white/5">
      <div className="aspect-[2/3] skeleton" />
      <div className="p-2 space-y-2">
        <div className="h-3 skeleton rounded w-3/4" />
        <div className="h-2.5 skeleton rounded w-1/2" />
      </div>
    </div>
  );
}

export function HeroSkeleton() {
  return (
    <div className="w-full h-[85vh] skeleton relative">
      <div className="absolute bottom-24 left-12 space-y-4 w-1/3">
        <div className="h-12 skeleton rounded-xl w-full" />
        <div className="h-4 skeleton rounded w-full" />
        <div className="h-4 skeleton rounded w-5/6" />
        <div className="flex gap-3 mt-4">
          <div className="h-10 w-32 skeleton rounded-lg" />
          <div className="h-10 w-28 skeleton rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="min-h-screen pt-16">
      <div className="w-full h-[60vh] skeleton" />
      <div className="max-w-7xl mx-auto px-6 py-8 grid md:grid-cols-[280px_1fr] gap-8">
        <div className="space-y-4">
          <div className="aspect-[2/3] skeleton rounded-xl" />
        </div>
        <div className="space-y-4">
          <div className="h-10 skeleton rounded-xl w-2/3" />
          <div className="h-4 skeleton rounded w-1/3" />
          <div className="h-4 skeleton rounded w-full" />
          <div className="h-4 skeleton rounded w-5/6" />
          <div className="h-4 skeleton rounded w-4/5" />
        </div>
      </div>
    </div>
  );
}

export function RowSkeleton({ title }) {
  return (
    <section className="py-2">
      <div className="flex items-center justify-between mb-4 px-4 md:px-12">
        <div className="section-title">{title}</div>
      </div>
      <div className="flex gap-4 px-4 md:px-12 overflow-hidden">
        {Array.from({ length: 7 }).map((_, i) => <CardSkeleton key={i} />)}
      </div>
    </section>
  );
}
