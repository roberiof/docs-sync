"use client";

import { type Editor, useEditorState } from "@tiptap/react";
import {
  Bold,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  List,
  ListOrdered,
  Quote,
  SquareCode,
  Strikethrough,
} from "lucide-react";
import type { ComponentType } from "react";

import { cn } from "@/lib/utils";

type ToolItem = {
  icon: ComponentType<{ className?: string }>;
  label: string;
  active: boolean;
  run: () => void;
};

export function Toolbar({ editor }: { editor: Editor }) {
  const activeState = useEditorState({
    editor,
    selector: (ctx) => ({
      bold: ctx.editor.isActive("bold"),
      italic: ctx.editor.isActive("italic"),
      strike: ctx.editor.isActive("strike"),
      code: ctx.editor.isActive("code"),
      codeBlock: ctx.editor.isActive("codeBlock"),
      h1: ctx.editor.isActive("heading", { level: 1 }),
      h2: ctx.editor.isActive("heading", { level: 2 }),
      h3: ctx.editor.isActive("heading", { level: 3 }),
      bulletList: ctx.editor.isActive("bulletList"),
      orderedList: ctx.editor.isActive("orderedList"),
      blockquote: ctx.editor.isActive("blockquote"),
    }),
  });

  const items: (ToolItem | "divider")[] = [
    {
      icon: Bold,
      label: "Bold",
      active: activeState.bold,
      run: () => editor.chain().focus().toggleBold().run(),
    },
    {
      icon: Italic,
      label: "Italic",
      active: activeState.italic,
      run: () => editor.chain().focus().toggleItalic().run(),
    },
    {
      icon: Strikethrough,
      label: "Strikethrough",
      active: activeState.strike,
      run: () => editor.chain().focus().toggleStrike().run(),
    },
    {
      icon: Code,
      label: "Inline code",
      active: activeState.code,
      run: () => editor.chain().focus().toggleCode().run(),
    },
    {
      icon: SquareCode,
      label: "Code block",
      active: activeState.codeBlock,
      run: () => editor.chain().focus().toggleCodeBlock().run(),
    },
    "divider",
    {
      icon: Heading1,
      label: "Heading 1",
      active: activeState.h1,
      run: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
    },
    {
      icon: Heading2,
      label: "Heading 2",
      active: activeState.h2,
      run: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      icon: Heading3,
      label: "Heading 3",
      active: activeState.h3,
      run: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
    },
    "divider",
    {
      icon: List,
      label: "Bullet list",
      active: activeState.bulletList,
      run: () => editor.chain().focus().toggleBulletList().run(),
    },
    {
      icon: ListOrdered,
      label: "Ordered list",
      active: activeState.orderedList,
      run: () => editor.chain().focus().toggleOrderedList().run(),
    },
    {
      icon: Quote,
      label: "Blockquote",
      active: activeState.blockquote,
      run: () => editor.chain().focus().toggleBlockquote().run(),
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-1">
      {items.map((item, i) =>
        item === "divider" ? (
          <span key={i} className="bg-border mx-1 h-5 w-px" />
        ) : (
          <button
            key={item.label}
            type="button"
            aria-label={item.label}
            title={item.label}
            aria-pressed={item.active}
            onClick={item.run}
            className={cn(
              "text-muted-foreground hover:bg-ultramarine-50 hover:text-foreground flex size-8 items-center justify-center rounded-lg transition-colors",
              item.active && "bg-ultramarine-100 text-primary",
            )}
          >
            <item.icon className="size-4" />
          </button>
        ),
      )}
    </div>
  );
}
