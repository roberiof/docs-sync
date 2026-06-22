import { Skeleton } from "@/components/ui/skeleton";

/** Loading placeholder mirroring the document layout. Shared by the route
 * `loading.tsx` and the page's <Suspense> fallback so they never drift. */
export function DocumentSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="border-border bg-background/80 mx-auto flex min-h-9 w-full max-w-3xl items-center justify-between gap-3 rounded-3xl border-b px-4 py-2 backdrop-blur">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-7 w-24 rounded-full" />
      </div>

      <div className="mx-auto w-full max-w-3xl space-y-8 px-4">
        <Skeleton className="h-10 w-2/3" />
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-11/12" />
          <Skeleton className="h-4 w-10/12" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-9/12" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-10/12" />
          <Skeleton className="h-4 w-11/12" />
        </div>
      </div>
    </div>
  );
}
