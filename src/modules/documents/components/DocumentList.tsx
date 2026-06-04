import { FileText } from "lucide-react";

import type { DocumentListItem } from "@/modules/documents/queries";

import { DocCard } from "./DocCard";
import { NewDocButton } from "./NewDocButton";

export function DocumentList({ documents }: { documents: DocumentListItem[] }) {
  if (documents.length === 0) {
    return (
      <div className="border-border flex flex-col items-center justify-center rounded-2xl border border-dashed py-20 text-center">
        <span className="bg-ultramarine-50 text-primary flex size-12 items-center justify-center rounded-2xl">
          <FileText className="size-6" />
        </span>
        <h2 className="text-foreground mt-4 font-serif text-xl">No documents yet</h2>
        <p className="text-muted-foreground mt-1 mb-6 max-w-xs text-sm">
          Create your first document and start writing together in real time.
        </p>
        <NewDocButton />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {documents.map((doc) => (
        <DocCard key={doc.id} doc={doc} />
      ))}
    </div>
  );
}
