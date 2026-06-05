import { createClient } from "@/lib/supabase/server";
import type { CollaboratorWithProfile, Document, Profile } from "@/types";

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

/**
 * Collaborators on a document, joined with their public profile. RLS lets the
 * owner see all rows. `document_collaborators.user_id` FKs to auth.users (not
 * profiles), so we resolve profiles in a second query.
 */
export async function getDocumentCollaborators(
  documentId: string,
): Promise<CollaboratorWithProfile[]> {
  const supabase = await createClient();

  const { data: rows, error } = await supabase
    .from("document_collaborators")
    .select("*")
    .eq("document_id", documentId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  if (!rows?.length) return [];

  const { data: profiles, error: pErr } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, email")
    .in(
      "id",
      rows.map((r) => r.user_id),
    );
  if (pErr) throw pErr;

  const byId = new Map((profiles ?? []).map((p) => [p.id, p]));
  return rows.map((row) => ({ ...row, profile: byId.get(row.user_id) ?? null }));
}

/** The owner's public profile (for the "shared with you" guest banner). */
export async function getDocumentOwner(
  ownerId: string,
): Promise<Pick<Profile, "full_name" | "email"> | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", ownerId)
    .maybeSingle();

  if (error) throw error;
  return data;
}
