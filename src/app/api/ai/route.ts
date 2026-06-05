import { createClient } from "@/lib/supabase/server";
import { AI_ACTIONS, type AiAction, suggest } from "@/lib/ai/ai";

function isAiAction(value: unknown): value is AiAction {
  return typeof value === "string" && (AI_ACTIONS as readonly string[]).includes(value);
}

export async function POST(request: Request) {
  // Auth — the route is reachable by direct POST, so verify the session here.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Validate input at the boundary.
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { action, selection } = (body ?? {}) as { action?: unknown; selection?: unknown };
  if (!isAiAction(action) || typeof selection !== "string" || selection.trim() === "") {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    const text = await suggest({ action, text: selection });
    return Response.json({ text });
  } catch (error) {
    console.error("AI suggestion failed:", error);
    return Response.json({ error: "AI request failed" }, { status: 500 });
  }
}
