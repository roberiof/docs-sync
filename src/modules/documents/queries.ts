import { createClient } from "@/lib/supabase/server";
import type { Document } from "@/types";

export type DocumentListItem = Pick<Document, "id" | "title" | "updated_at">;

/** Documents the current user can see (owner + collaborator), newest first. RLS-scoped. */
export async function listMyDocuments(): Promise<DocumentListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("documents")
    .select("id, title, updated_at")
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

/** A single document by id, or null if not found / not accessible (RLS). */
export async function getDocument(id: string): Promise<Document | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("documents").select("*").eq("id", id).maybeSingle();

  if (error) throw error;
  return data;
}
