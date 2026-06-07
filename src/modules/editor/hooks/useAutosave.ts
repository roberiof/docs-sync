"use client";

import type { Editor } from "@tiptap/react";
import { useEffect, useRef, useState } from "react";
import * as Y from "yjs";

import type { Json } from "@/lib/supabase/types";
import { saveDocumentContent } from "@/modules/documents/actions";

export type SaveStatus = "idle" | "saving" | "saved";

const DEBOUNCE_MS = 1500;

/** Debounced autosave of the editor JSON + Yjs binary state to Supabase. Returns a status flag. */
export function useAutosave(editor: Editor | null, docId: string, ydoc?: Y.Doc): SaveStatus {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!editor) return;

    const handleUpdate = () => {
      setStatus("saving");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(async () => {
        try {
          let ydocState: string | undefined;
          if (ydoc) {
            const bytes = Y.encodeStateAsUpdate(ydoc);
            ydocState = btoa(String.fromCharCode(...bytes));
          }
          await saveDocumentContent(docId, editor.getJSON() as Json, ydocState);
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
  }, [editor, docId, ydoc]);

  return status;
}
