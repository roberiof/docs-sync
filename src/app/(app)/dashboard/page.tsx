import type { Metadata } from "next";
import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { DocumentList } from "@/modules/documents/components/DocumentList";
import { NewDocButton } from "@/modules/documents/components/NewDocButton";
import { listMyDocuments } from "@/modules/documents/queries";

export const metadata: Metadata = { title: "Dashboard" };

/** Reads documents (request data) — under <Suspense> for Cache Components. */
async function Documents() {
  const documents = await listMyDocuments();
  return <DocumentList documents={documents} />;
}

function DocumentsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-36 rounded-2xl" />
      ))}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-foreground font-serif text-3xl tracking-tight">Your documents</h1>
          <p className="text-muted-foreground mt-1 text-[15px]">
            Create and manage your collaborative documents.
          </p>
        </div>
        <NewDocButton />
      </div>

      <Suspense fallback={<DocumentsSkeleton />}>
        <Documents />
      </Suspense>
    </div>
  );
}
