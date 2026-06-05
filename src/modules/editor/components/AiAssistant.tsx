"use client";

import { type Editor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import { Loader2, PenLine, Sparkles, Text } from "lucide-react";
import { type ComponentType, useState } from "react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

// Kept in sync with `AI_ACTIONS` in `@/lib/ai/ai` (server-only — can't import here).
type AiAction = "improve" | "summarize" | "continue";

type Action = {
  id: AiAction;
  label: string;
  icon: ComponentType<{ className?: string }>;
};

const ACTIONS: Action[] = [
  { id: "improve", label: "Improve", icon: Sparkles },
  { id: "summarize", label: "Summarize", icon: Text },
  { id: "continue", label: "Continue", icon: PenLine },
];

export function AiAssistant({ editor }: { editor: Editor }) {
  const [pending, setPending] = useState<AiAction | null>(null);

  async function run(action: AiAction) {
    if (pending) return;

    const { from, to } = editor.state.selection;
    const selection = editor.state.doc.textBetween(from, to, " ");
    if (!selection.trim()) return;

    setPending(action);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, selection }),
      });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);

      const { text } = (await res.json()) as { text?: string };
      if (!text) throw new Error("Empty response");

      // "Continue" appends after the selection; the others replace it.
      if (action === "continue") {
        editor.chain().focus().insertContentAt(to, ` ${text}`).run();
      } else {
        editor.chain().focus().insertContentAt({ from, to }, text).run();
      }
    } catch (error) {
      console.error(error);
      toast.error("AI suggestion failed. Try again.");
    } finally {
      setPending(null);
    }
  }

  return (
    <BubbleMenu
      editor={editor}
      shouldShow={({ from, to }) => to > from}
      options={{ placement: "top", offset: 8 }}
    >
      <div className="border-border flex items-center gap-1 rounded-xl border bg-white p-1 shadow-md">
        {ACTIONS.map((action) => {
          const isLoading = pending === action.id;
          return (
            <button
              key={action.id}
              type="button"
              disabled={pending !== null}
              onClick={() => run(action.id)}
              className={cn(
                "text-muted-foreground hover:bg-ultramarine-50 hover:text-foreground flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors",
                "disabled:cursor-not-allowed disabled:opacity-60",
                isLoading && "text-primary",
              )}
            >
              {isLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <action.icon className="size-4" />
              )}
              {action.label}
            </button>
          );
        })}
      </div>
    </BubbleMenu>
  );
}
