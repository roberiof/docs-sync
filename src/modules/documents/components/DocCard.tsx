"use client";

import { Crown, FileText, MoreHorizontal, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button, buttonVariants } from "@/components/ui/button";
import { UserAvatar } from "@/components/ui/user-avatar";
import { getUserColor } from "@/lib/utils/colors";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { deleteDocument } from "@/modules/documents/actions";
import type { DocumentListItem } from "@/modules/documents/queries";
import { formatRelativeTime } from "@/modules/documents/utils";

export function DocCard({ doc }: { doc: DocumentListItem }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const ownerName = doc.owner?.full_name?.trim() || doc.owner?.email?.split("@")[0] || "Someone";

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteDocument(doc.id);
        toast.success("Document deleted.");
        setConfirmOpen(false);
      } catch {
        toast.error("Couldn't delete the document.");
      }
    });
  }

  return (
    <div className="group border-border bg-card hover:border-ultramarine-300 relative rounded-2xl border p-5 transition-colors">
      <Link href={`/doc/${doc.id}`} className="block">
        <span className="bg-ultramarine-50 text-primary flex size-10 items-center justify-center rounded-xl">
          <FileText className="size-5" />
        </span>
        <h3 className="text-foreground mt-4 truncate font-serif text-lg">{doc.title}</h3>
        <p className="text-muted-foreground mt-1 text-sm">
          Edited {formatRelativeTime(doc.updated_at)}
        </p>

        {doc.isMine ? (
          <span className="text-muted-foreground mt-3 inline-flex items-center gap-1.5 text-xs font-medium">
            <Crown className="size-3.5 text-amber-500" />
            Owned by you
          </span>
        ) : (
          <span className="text-muted-foreground mt-3 inline-flex items-center gap-1.5 text-xs">
            <UserAvatar
              name={ownerName}
              color={getUserColor(doc.owner_id)}
              imageUrl={doc.owner?.avatar_url}
              className="size-4"
            />
            <span className="truncate">
              Shared by <span className="text-foreground font-medium">{ownerName}</span>
            </span>
          </span>
        )}
      </Link>

      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="Document actions"
          className={cn(
            buttonVariants({ variant: "ghost", size: "icon" }),
            "text-muted-foreground absolute top-3 right-3 size-8 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 data-popup-open:opacity-100",
          )}
        >
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem variant="destructive" onClick={() => setConfirmOpen(true)}>
            <Trash2 className="size-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete document?</DialogTitle>
            <DialogDescription>
              “{doc.title}” will be permanently deleted. This can’t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={pending}>
              {pending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
