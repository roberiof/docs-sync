"use client";

import { useEffect, useMemo } from "react";

import type { User } from "@/lib/yjs/provider";
import type { Json } from "@/lib/supabase/types";
import { createYProvider } from "@/lib/yjs/provider";
import { Editor } from "@/modules/editor/components/Editor";

type Props = {
  docId: string;
  initialTitle: string;
  initialContent: Json;
  user: User;
};

export function EditorWithCollaboration({ docId, initialTitle, initialContent, user }: Props) {
  // Construction is side-effect-free (socket stays closed); the effect below
  // owns the connection lifecycle.
  const { ydoc, provider } = useMemo(() => createYProvider(docId, user), [docId, user]);

  useEffect(() => {
    provider.connect();
    return () => {
      provider.destroy();
      ydoc.destroy();
    };
  }, [ydoc, provider]);

  return (
    <Editor
      docId={docId}
      initialTitle={initialTitle}
      initialContent={initialContent}
      ydoc={ydoc}
      provider={provider}
      user={user}
    />
  );
}
