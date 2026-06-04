"use client";

import type { Editor } from "@tiptap/react";
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
  isActive: () => boolean;
  run: () => void;
};

export function Toolbar({ editor }: { editor: Editor }) {
  const items: (ToolItem | "divider")[] = [
    {
      icon: Bold,
      label: "Bold",
      isActive: () => editor.isActive("bold"),
      run: () => editor.chain().focus().toggleBold().run(),
    },
    {
      icon: Italic,
      label: "Italic",
      isActive: () => editor.isActive("italic"),
      run: () => editor.chain().focus().toggleItalic().run(),
    },
    {
      icon: Strikethrough,
      label: "Strikethrough",
      isActive: () => editor.isActive("strike"),
      run: () => editor.chain().focus().toggleStrike().run(),
    },
    {
      icon: Code,
      label: "Inline code",
      isActive: () => editor.isActive("code"),
      run: () => editor.chain().focus().toggleCode().run(),
    },
    {
      icon: SquareCode,
      label: "Code block",
      isActive: () => editor.isActive("codeBlock"),
      run: () => editor.chain().focus().toggleCodeBlock().run(),
    },
    "divider",
    {
      icon: Heading1,
      label: "Heading 1",
      isActive: () => editor.isActive("heading", { level: 1 }),
      run: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
    },
    {
      icon: Heading2,
      label: "Heading 2",
      isActive: () => editor.isActive("heading", { level: 2 }),
      run: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      icon: Heading3,
      label: "Heading 3",
      isActive: () => editor.isActive("heading", { level: 3 }),
      run: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
    },
    "divider",
    {
      icon: List,
      label: "Bullet list",
      isActive: () => editor.isActive("bulletList"),
      run: () => editor.chain().focus().toggleBulletList().run(),
    },
    {
      icon: ListOrdered,
      label: "Ordered list",
      isActive: () => editor.isActive("orderedList"),
      run: () => editor.chain().focus().toggleOrderedList().run(),
    },
    {
      icon: Quote,
      label: "Blockquote",
      isActive: () => editor.isActive("blockquote"),
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
            aria-pressed={item.isActive()}
            onClick={item.run}
            className={cn(
              "text-muted-foreground hover:bg-ultramarine-50 hover:text-foreground flex size-8 items-center justify-center rounded-lg transition-colors",
              item.isActive() && "bg-ultramarine-100 text-primary",
            )}
          >
            <item.icon className="size-4" />
          </button>
        ),
      )}
    </div>
  );
}
