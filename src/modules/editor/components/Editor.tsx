"use client";

import { type Content, EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useState } from "react";

import type { Json } from "@/lib/supabase/types";
import { renameDocument } from "@/modules/documents/actions";
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
};

export function Editor({ docId, initialTitle, initialContent }: Props) {
  const [title, setTitle] = useState(initialTitle);

  const editor = useEditor({
    extensions: [StarterKit.configure({ heading: { levels: [1, 2, 3] } })],
    content: toEditorContent(initialContent),
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: PROSE_CLASS,
      },
    },
  });

  const status = useAutosave(editor, docId);

  // Keep the browser tab in sync with the (live-editable) title.
  useEffect(() => {
    document.title = `${title || "Untitled"} · DocSync`;
  }, [title]);

  function commitTitle() {
    const next = title.trim() || "Untitled";
    setTitle(next);
    if (next !== initialTitle) renameDocument(docId, next);
  }

  return (
    <div className="bg-canvas -mx-5 -my-8 min-h-[calc(100svh-3.5rem)] px-4 pb-20">
      <div className="mx-auto max-w-3xl">
        {/* Title — above the page, like Google Docs. */}
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
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
          <div className="border-border flex items-center justify-between gap-2 rounded-xl border bg-white px-2 py-1 shadow-sm">
            {editor && <Toolbar editor={editor} />}
            <span className="text-muted-foreground w-16 shrink-0 pr-1 text-right text-xs">
              {STATUS_LABEL[status]}
            </span>
          </div>
        </div>

        {/* The white page sheet (content only). */}
        <div className="border-border mt-3 rounded-xl border bg-white px-8 py-12 shadow-sm">
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
}
