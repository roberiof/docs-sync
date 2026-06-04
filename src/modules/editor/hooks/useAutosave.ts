"use client";

import type { Editor } from "@tiptap/react";
import { useEffect, useRef, useState } from "react";

import type { Json } from "@/lib/supabase/types";
import { saveDocumentContent } from "@/modules/documents/actions";

export type SaveStatus = "idle" | "saving" | "saved";

const DEBOUNCE_MS = 1500;

/** Debounced autosave of the editor JSON to Supabase. Returns a status flag. */
export function useAutosave(editor: Editor | null, docId: string): SaveStatus {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!editor) return;

    const handleUpdate = () => {
      setStatus("saving");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(async () => {
        try {
          await saveDocumentContent(docId, editor.getJSON() as Json);
          setStatus("saved");
        } catch {
          setStatus("idle");
        }
      }, DEBOUNCE_MS);
    };

    editor.on("update", handleUpdate);
    return () => {
      editor.off("update", handleUpdate);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [editor, docId]);

  return status;
}
