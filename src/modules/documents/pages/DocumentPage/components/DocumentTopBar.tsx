import { Crown } from "lucide-react";

import { GuestBanner } from "@/modules/documents/components/GuestBanner";
import { ShareDocument } from "@/modules/documents/components/ShareDocument";
import type { CollaboratorWithProfile, Profile } from "@/types";

type Props = {
  docId: string;
  isOwner: boolean;
  /** Collaborators on the document — owner view only. */
  collaborators: CollaboratorWithProfile[];
  /** The owner's public profile — guest view only. */
  owner: Pick<Profile, "full_name" | "email" | "avatar_url"> | null;
  /** Stable color for the owner's avatar in the guest banner. */
  ownerColor: string;
};

/** Top bar above the document sheet: ownership status + share controls (owner)
 * or a banner naming the owner (guest). Same width as the sheet, centered. */
export function DocumentTopBar({ docId, isOwner, collaborators, owner, ownerColor }: Props) {
  return (
    <div className="border-border bg-background/80 mx-auto flex min-h-9 w-full max-w-3xl items-center justify-between gap-3 rounded-3xl border-b px-4 py-2 backdrop-blur">
      {isOwner ? (
        <>
          <span className="text-muted-foreground inline-flex items-center gap-1.5 text-xs font-medium">
            <Crown className="size-3.5 text-amber-500" />
            You own this document
          </span>
          <ShareDocument docId={docId} collaborators={collaborators} />
        </>
      ) : (
        <div className="ml-auto">
          <GuestBanner
            ownerName={owner?.full_name ?? null}
            ownerEmail={owner?.email ?? ""}
            ownerColor={ownerColor}
            ownerAvatarUrl={owner?.avatar_url ?? null}
          />
        </div>
      )}
    </div>
  );
}
