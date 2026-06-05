"use client";

import { Share2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/ui/user-avatar";
import { getUserColor } from "@/lib/utils/colors";
import { addCollaborator, removeCollaborator } from "@/modules/documents/actions";
import type { CollaboratorWithProfile } from "@/types";

type Props = {
  docId: string;
  collaborators: CollaboratorWithProfile[];
};

function displayName(c: CollaboratorWithProfile): string {
  return c.profile?.full_name?.trim() || c.profile?.email?.split("@")[0] || "Unknown user";
}

export function ShareDocument({ docId, collaborators }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleShare(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError(null);
    try {
      await addCollaborator(docId, email.trim(), "editor");
      setEmail("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add collaborator");
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove(userId: string) {
    setRemovingId(userId);
    setError(null);
    try {
      await removeCollaborator(docId, userId);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove collaborator");
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group border-border hover:bg-muted flex items-center gap-2 rounded-full border bg-white py-1 pr-3 pl-1.5 text-sm font-medium shadow-sm transition-colors"
      >
        {collaborators.length > 0 ? (
          <>
            <div className="flex -space-x-2">
              {collaborators.slice(0, 3).map((c) => (
                <UserAvatar
                  key={c.user_id}
                  name={displayName(c)}
                  color={getUserColor(c.user_id)}
                  imageUrl={c.profile?.avatar_url}
                  className="size-6"
                />
              ))}
              {collaborators.length > 3 && (
                <div className="ring-background bg-muted text-muted-foreground flex size-6 items-center justify-center rounded-full text-[0.6rem] font-semibold ring-2">
                  +{collaborators.length - 3}
                </div>
              )}
            </div>
            <span>
              {collaborators.length} collaborator{collaborators.length > 1 ? "s" : ""}
            </span>
            <span className="bg-border h-4 w-px" aria-hidden />
            <Share2 className="text-muted-foreground size-4" />
          </>
        ) : (
          <>
            <Share2 className="size-4" />
            Share
          </>
        )}
      </button>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share document</DialogTitle>
          <DialogDescription>Invite people by email to collaborate in real time.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleShare} className="flex items-start gap-2">
          <Input
            type="email"
            placeholder="collaborator@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
          <Button type="submit" disabled={loading || !email.trim()}>
            {loading ? "Adding…" : "Invite"}
          </Button>
        </form>

        {error && (
          <div className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-1">
          <p className="text-muted-foreground text-xs font-medium">
            People with access ({collaborators.length})
          </p>

          {collaborators.length === 0 ? (
            <p className="text-muted-foreground py-3 text-sm">
              Only you have access. Invite someone above.
            </p>
          ) : (
            <ul className="divide-border divide-y">
              {collaborators.map((c) => (
                <li key={c.user_id} className="flex items-center gap-3 py-2">
                  <UserAvatar
                    name={displayName(c)}
                    color={getUserColor(c.user_id)}
                    imageUrl={c.profile?.avatar_url}
                    className="size-8"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{displayName(c)}</p>
                    <p className="text-muted-foreground truncate text-xs">{c.profile?.email}</p>
                  </div>
                  <span className="text-muted-foreground text-xs capitalize">{c.role}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive size-8 shrink-0"
                    onClick={() => handleRemove(c.user_id)}
                    disabled={removingId === c.user_id}
                    aria-label={`Remove ${displayName(c)}`}
                  >
                    <X className="size-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
