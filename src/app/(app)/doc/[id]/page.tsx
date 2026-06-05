import { Crown } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { getUserColor } from "@/lib/utils/colors";
import { createClient } from "@/lib/supabase/server";
import {
  getDocument,
  getDocumentCollaborators,
  getDocumentOwner,
} from "@/modules/documents/queries";
import { EditorWithCollaboration } from "@/modules/editor/components/EditorWithCollaboration";
import { GuestBanner } from "@/modules/documents/components/GuestBanner";
import { ShareDocument } from "@/modules/documents/components/ShareDocument";

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
  const [doc, supabase] = await Promise.all([getDocument(id), createClient()]);
  if (!doc) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const isOwner = doc.owner_id === user.id;

  // Owner manages collaborators; guests see who owns the doc. Fetch only what
  // the current viewer needs.
  const [collaborators, owner] = await Promise.all([
    isOwner ? getDocumentCollaborators(doc.id) : Promise.resolve([]),
    isOwner ? Promise.resolve(null) : getDocumentOwner(doc.owner_id),
  ]);

  // Display name for live cursors: profile name → auth metadata → email local
  // part. Avoids the generic "Anonymous" label.
  const displayName =
    profile?.full_name?.trim() ||
    (user.user_metadata?.full_name as string | undefined)?.trim() ||
    user.email?.split("@")[0] ||
    null;

  return (
    <div className="flex flex-col gap-6">
      {/* Top bar — same width as the document sheet (max-w-3xl), centered. */}
      <div className="border-border bg-background/80 mx-auto flex min-h-9 w-full max-w-3xl items-center justify-between gap-3 rounded-3xl border-b px-4 py-2 backdrop-blur">
        {isOwner ? (
          <>
            <span className="text-muted-foreground inline-flex items-center gap-1.5 text-xs font-medium">
              <Crown className="size-3.5 text-amber-500" />
              You own this document
            </span>
            <ShareDocument docId={doc.id} collaborators={collaborators} />
          </>
        ) : (
          <div className="ml-auto">
            <GuestBanner
              ownerName={owner?.full_name ?? null}
              ownerEmail={owner?.email ?? ""}
              ownerColor={getUserColor(doc.owner_id)}
            />
          </div>
        )}
      </div>
      <EditorWithCollaboration
        docId={doc.id}
        initialTitle={doc.title}
        initialContent={doc.content}
        user={{
          name: displayName,
          color: getUserColor(user.id),
        }}
      />
    </div>
  );
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
