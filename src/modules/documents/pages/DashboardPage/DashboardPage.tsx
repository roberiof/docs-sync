import { Suspense } from "react";

import { DocumentList } from "@/modules/documents/components/DocumentList";
import { NewDocButton } from "@/modules/documents/components/NewDocButton";
import { listMyDocuments } from "@/modules/documents/queries";

import { DocumentsSkeleton } from "./components/DocumentsSkeleton";

/** Reads documents (request data) — under <Suspense> for Cache Components. */
async function Documents() {
  const documents = await listMyDocuments();
  return <DocumentList documents={documents} />;
}

export function DashboardPage() {
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

export default DashboardPage;
