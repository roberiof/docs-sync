"use client";

import { type Content, EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCaret from "@tiptap/extension-collaboration-caret";
import { useEffect, useRef, useState } from "react";
import type * as Y from "yjs";
import type { SupabaseProvider } from "@/lib/yjs/supabase-provider";

import type { User } from "@/lib/yjs/provider";
import type { Json } from "@/lib/supabase/types";
import { renameDocument } from "@/modules/documents/actions";
import { AiAssistant } from "@/modules/editor/components/AiAssistant";
import { CollaboratorsCursors } from "@/modules/editor/components/CollaboratorsCursors";
import { Toolbar } from "@/modules/editor/components/Toolbar";
import { useAutosave } from "@/modules/editor/hooks/useAutosave";

/** A jsonb default of {} is not a valid Tiptap doc — treat it as empty. */
function toEditorContent(content: Json): Content {
  if (content && typeof content === "object" && "type" in content) {
    return content as Content;
  }
  return "";
}

const STATUS_LABEL = { idle: "", saving: "Saving…", saved: "Saved" } as const;

const PROSE_CLASS = [
  "prose prose-neutral max-w-none min-h-[55vh] focus:outline-none",
  // tighter paragraph + list spacing
  "prose-p:my-2.5 prose-li:my-1 [&_li>p]:my-0",
  // inline code: small Discord-style chip; drop prose's backtick pseudo-elements.
  "prose-code:before:content-none prose-code:after:content-none",
  "prose-code:rounded prose-code:bg-[#2b2d31] prose-code:px-1.5 prose-code:py-0.5",
  "prose-code:font-medium prose-code:text-[#e3e5e8]",
  // code block: one continuous dark block (like a blockquote spanning lines).
  "prose-pre:rounded-lg prose-pre:bg-[#2b2d31] prose-pre:text-[#e3e5e8]",
  "prose-pre:whitespace-pre-wrap prose-pre:break-words",
  // the <code> inside a <pre> is inline — the chip's padding/bg would indent only
  // the first line. Strip them so every line of the block aligns flush.
  "[&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-inherit",
].join(" ");

type Props = {
  docId: string;
  initialTitle: string;
  initialContent: Json;
  ydoc?: Y.Doc;
  provider?: SupabaseProvider;
  user?: User;
};

export function Editor({ docId, initialTitle, initialContent, ydoc, provider, user }: Props) {
  const [title, setTitle] = useState(initialTitle);

  const extensions = [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
      // Yjs ships its own (shared) undo history via Collaboration; the local one
      // would corrupt the CRDT, so disable StarterKit's.
      ...(ydoc ? { undoRedo: false as const } : {}),
    }),
    // Bind the editor to the shared Y.Doc — this is the real ProseMirror↔Yjs
    // sync. The WebsocketProvider feeds remote updates into `ydoc`.
    ...(ydoc ? [Collaboration.configure({ document: ydoc })] : []),
    // Live remote carets + selections, labelled with each editor's name/color.
    ...(provider && user
      ? [
          CollaborationCaret.configure({
            provider,
            user: { name: user.name || "Anonymous", color: user.color },
          }),
        ]
      : []),
  ];

  const editor = useEditor({
    extensions,
    // With collaboration, content lives in the Y.Doc, not here. Only seed the
    // editor directly in the non-collaborative fallback.
    content: ydoc ? undefined : toEditorContent(initialContent),
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: PROSE_CLASS,
      },
    },
  });

  // First client into an empty room seeds the Y.Doc from the DB content. Later
  // clients sync from the server, find the fragment non-empty, and skip.
  useEffect(() => {
    if (!editor || !ydoc || !provider) return;

    const seed = (synced: boolean) => {
      if (!synced) return;
      // Seed the shared title once, if nobody has yet.
      const ytitle = ydoc.getText("title");
      if (ytitle.length === 0 && initialTitle) ytitle.insert(0, initialTitle);
      // Seed the body once, if the room is empty.
      if (ydoc.getXmlFragment("default").length > 0) return;
      const content = toEditorContent(initialContent);
      if (content) editor.commands.setContent(content);
    };

    provider.on("sync", seed);
    if (provider.synced) seed(true);

    return () => {
      provider.off("sync", seed);
    };
  }, [editor, ydoc, provider, initialContent, initialTitle]);

  const status = useAutosave(editor, docId);

  // Collaborative title: bind the <input> to a shared Y.Text("title"), the same
  // way the body binds to the Y.Doc. Remote edits flow in via `observe`; local
  // edits are persisted to the DB (debounced) so only one writer hits Supabase.
  const lastSavedTitle = useRef(initialTitle);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!ydoc) return;
    const ytitle = ydoc.getText("title");

    const sync = (_event: Y.YTextEvent, tr: Y.Transaction) => {
      const value = ytitle.toString();
      setTitle(value);
      if (!tr.local) return;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        const next = value.trim() || "Untitled";
        if (next !== lastSavedTitle.current) {
          lastSavedTitle.current = next;
          renameDocument(docId, next);
        }
      }, 800);
    };

    ytitle.observe(sync);
    setTitle(ytitle.toString() || initialTitle);

    return () => {
      ytitle.unobserve(sync);
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [ydoc, docId, initialTitle]);

  // Keep the browser tab in sync with the (live-editable) title.
  useEffect(() => {
    document.title = `${title || "Untitled"} · DocSync`;
  }, [title]);

  // Local title edit → rewrite the shared Y.Text (or local state in the
  // non-collaborative fallback).
  function changeTitle(value: string) {
    if (!ydoc) {
      setTitle(value);
      return;
    }
    const ytitle = ydoc.getText("title");
    ydoc.transact(() => {
      ytitle.delete(0, ytitle.length);
      ytitle.insert(0, value);
    });
  }

  function commitTitle() {
    const next = title.trim() || "Untitled";
    if (next !== title) changeTitle(next);
    if (next !== lastSavedTitle.current) {
      lastSavedTitle.current = next;
      renameDocument(docId, next);
    }
  }

  return (
    <div className="bg-canvas -mx-5 -my-8 min-h-[calc(100svh-3.5rem)] px-4 pb-20">
      <div className="mx-auto max-w-3xl">
        {/* Title — above the page, like Google Docs. */}
        <input
          value={title}
          onChange={(e) => changeTitle(e.target.value)}
          onBlur={commitTitle}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
          placeholder="Untitled"
          aria-label="Document title"
          className="text-foreground placeholder:text-muted-foreground mt-6 w-full rounded-lg bg-transparent px-4 pt-2 pb-1 font-serif text-2xl tracking-tight transition-colors outline-none hover:bg-white/60 focus:bg-white"
        />

        {/* Toolbar — rounded card, sticky, same width as the page. */}
        <div className="sticky top-16 z-10 mt-2">
          <div className="border-border flex items-center gap-2 rounded-xl border bg-white px-2 py-1 shadow-sm">
            {editor && <Toolbar editor={editor} />}
            <div className="flex-1" />
            <span className="text-muted-foreground w-16 shrink-0 pr-1 text-right text-xs">
              {STATUS_LABEL[status]}
            </span>
            {provider && <CollaboratorsCursors provider={provider} />}
          </div>
        </div>

        {/* The white page sheet (content only). */}
        <div className="border-border mt-3 rounded-xl border bg-white px-8 py-12 shadow-sm">
          {editor && <AiAssistant editor={editor} />}
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
}
