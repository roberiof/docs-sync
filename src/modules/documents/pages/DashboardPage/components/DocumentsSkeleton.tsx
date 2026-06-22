import { Skeleton } from "@/components/ui/skeleton";

/** Loading placeholder for the document grid. */
export function DocumentsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-36 rounded-2xl" />
      ))}
    </div>
  );
}
