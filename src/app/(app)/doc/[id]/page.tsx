import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { getDocument } from "@/modules/documents/queries";
import { Editor } from "@/modules/editor/components/Editor";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const doc = await getDocument(id);
  return { title: doc?.title || "Document" };
}

/** Reads the document (request data) — under <Suspense> for Cache Components. */
async function DocContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const doc = await getDocument(id);
  if (!doc) notFound();

  return <Editor docId={doc.id} initialTitle={doc.title} initialContent={doc.content} />;
}

function DocSkeleton() {
  return (
    <div className="mx-auto max-w-3xl">
      <Skeleton className="h-10 w-2/3" />
      <div className="mt-8 space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-11/12" />
        <Skeleton className="h-4 w-10/12" />
      </div>
    </div>
  );
}

export default function DocPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<DocSkeleton />}>
      <DocContent params={params} />
    </Suspense>
  );
}
