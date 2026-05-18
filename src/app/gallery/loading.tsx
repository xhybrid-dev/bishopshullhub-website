import { Skeleton } from '@/components/ui/skeleton';

export default function GalleryLoading() {
  return (
    <section className="bg-white py-16 px-6">
      <div className="max-w-7xl mx-auto pt-20">
        <Skeleton className="h-10 md:h-12 w-3/4 max-w-xl mx-auto mb-4" />
        <Skeleton className="h-5 w-1/2 max-w-md mx-auto mb-10" />

        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-28 rounded-lg" />
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      </div>
    </section>
  );
}
