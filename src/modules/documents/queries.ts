import { createClient } from "@/lib/supabase/server";
import type { CollaboratorWithProfile, Document, Profile } from "@/types";

export type DocumentListItem = Pick<Document, "id" | "title" | "updated_at" | "owner_id"> & {
  /** True when the current user owns the document (vs. shared with them). */
  isMine: boolean;
  /** The other owner's public profile — null when the document is the user's own. */
  owner: Pick<Profile, "full_name" | "avatar_url" | "email"> | null;
};

/** Documents the current user can see (owner + collaborator), newest first. RLS-scoped. */
export async function listMyDocuments(): Promise<DocumentListItem[]> {
  const supabase = await createClient();

  const [
    {
      data: { user },
    },
    { data, error },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("documents")
      .select("id, title, updated_at, owner_id")
      .order("updated_at", { ascending: false }),
  ]);

  if (error) throw error;
  const docs = data ?? [];

  // Resolve profiles only for documents owned by someone else (shared with me).
  const otherOwnerIds = [
    ...new Set(docs.filter((d) => d.owner_id !== user?.id).map((d) => d.owner_id)),
  ];

  let ownerById = new Map<string, Pick<Profile, "full_name" | "avatar_url" | "email">>();
  if (otherOwnerIds.length) {
    const { data: profiles, error: pErr } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url, email")
      .in("id", otherOwnerIds);
    if (pErr) throw pErr;
    ownerById = new Map((profiles ?? []).map((p) => [p.id, p]));
  }

  return docs.map((doc) => {
    const isMine = doc.owner_id === user?.id;
    return { ...doc, isMine, owner: isMine ? null : (ownerById.get(doc.owner_id) ?? null) };
  });
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

/**
 * The current authenticated user plus the display name and avatar used to render
 * the document viewer (live cursors, top bar). Null when signed out. Reads request
 * cookies via the server client, so it must never live inside a cached scope.
 */
export async function getDocumentViewer(): Promise<{
  userId: string;
  displayName: string | null;
  avatarUrl: string | null;
} | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url")
    .eq("id", user.id)
    .single();

  // Display name for live cursors: profile name → auth metadata → email local
  // part. Avoids the generic "Anonymous" label.
  const displayName =
    profile?.full_name?.trim() ||
    (user.user_metadata?.full_name as string | undefined)?.trim() ||
    user.email?.split("@")[0] ||
    null;

  return { userId: user.id, displayName, avatarUrl: profile?.avatar_url ?? null };
}

/** The owner's public profile (for the "shared with you" guest banner). */
export async function getDocumentOwner(
  ownerId: string,
): Promise<Pick<Profile, "full_name" | "email" | "avatar_url"> | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("full_name, email, avatar_url")
    .eq("id", ownerId)
    .maybeSingle();

  if (error) throw error;
  return data;
}
