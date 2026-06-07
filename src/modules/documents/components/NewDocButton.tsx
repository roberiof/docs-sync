"use client";

import { isRedirectError } from "next/dist/client/components/redirect-error";
import { Plus } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { createDocument } from "@/modules/documents/actions";

export function NewDocButton() {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      onClick={() =>
        startTransition(async () => {
          try {
            await createDocument();
          } catch (error) {
            if (isRedirectError(error)) throw error;
            toast.error("Couldn't create the document.");
          }
        })
      }
      disabled={pending}
      className="h-10 rounded-xl font-semibold shadow-sm"
    >
      <Plus className="size-4" />
      {pending ? "Creating..." : "New document"}
    </Button>
  );
}
