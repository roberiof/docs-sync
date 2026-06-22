import { notFound } from "next/navigation";

import { getUserColor } from "@/lib/utils/colors";
import {
  getDocument,
  getDocumentCollaborators,
  getDocumentOwner,
  getDocumentViewer,
} from "@/modules/documents/queries";
import { EditorWithCollaboration } from "@/modules/editor/components/EditorWithCollaboration";

import { DocumentTopBar } from "./DocumentTopBar";

/** Reads the document and viewer (request data) — rendered under <Suspense>
 * for Cache Components. */
export async function DocumentContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [doc, viewer] = await Promise.all([getDocument(id), getDocumentViewer()]);
  if (!doc) notFound();
  if (!viewer) notFound();

  const isOwner = doc.owner_id === viewer.userId;

  // Owner manages collaborators; guests see who owns the doc. Fetch only what
  // the current viewer needs.
  const [collaborators, owner] = await Promise.all([
    isOwner ? getDocumentCollaborators(doc.id) : Promise.resolve([]),
    isOwner ? Promise.resolve(null) : getDocumentOwner(doc.owner_id),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <DocumentTopBar
        docId={doc.id}
        isOwner={isOwner}
        collaborators={collaborators}
        owner={owner}
        ownerColor={getUserColor(doc.owner_id)}
      />
      <EditorWithCollaboration
        docId={doc.id}
        initialTitle={doc.title}
        initialContent={doc.content}
        ydocState={doc.ydoc_state}
        user={{
          name: viewer.displayName,
          color: getUserColor(viewer.userId),
          avatarUrl: viewer.avatarUrl,
        }}
      />
    </div>
  );
}
