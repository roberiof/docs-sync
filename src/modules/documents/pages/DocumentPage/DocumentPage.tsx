import { Suspense } from "react";

import { DocumentContent } from "./components/DocumentContent";
import { DocumentSkeleton } from "./components/DocumentSkeleton";

export function DocumentPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<DocumentSkeleton />}>
      <DocumentContent params={params} />
    </Suspense>
  );
}

export default DocumentPage;
