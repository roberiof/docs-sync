import * as Y from "yjs";

import { SupabaseProvider } from "@/lib/yjs/supabase-provider";

export type { User } from "@/lib/yjs/supabase-provider";
import type { User } from "@/lib/yjs/supabase-provider";

export function createYProvider(roomId: string, user: User, initialState?: string | null) {
  const ydoc = new Y.Doc();
  if (initialState) {
    const bytes = Uint8Array.from(atob(initialState), (c) => c.charCodeAt(0));
    Y.applyUpdate(ydoc, bytes);
  }
  // Construction is side-effect-free (the channel stays unsubscribed); the
  // caller opens it from an effect via `provider.connect()`.
  const provider = new SupabaseProvider(roomId, ydoc, user);
  return { ydoc, provider };
}
