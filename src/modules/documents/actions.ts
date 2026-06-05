"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/types";

/** Resolve the session; redirect to login if absent. Server Actions are public endpoints. */
async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

/** Create an empty document owned by the current user and open it. */
export async function createDocument() {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("documents")
    .insert({ owner_id: user.id, title: "Untitled", content: {} })
    .select("id")
    .single();

  if (error) throw error;
  redirect(`/doc/${data.id}`);
}

/** Rename a document (RLS allows owner / editor). */
export async function renameDocument(id: string, title: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("documents")
    .update({ title: title.trim() || "Untitled" })
    .eq("id", id);

  if (error) throw error;
  revalidatePath("/dashboard");
}

/** Persist the editor's JSON snapshot. Called (debounced) from the editor. */
export async function saveDocumentContent(id: string, content: Json) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("documents").update({ content }).eq("id", id);
  if (error) throw error;
}

/** Delete a document (RLS allows owner only). */
export async function deleteDocument(id: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("documents").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/dashboard");
}

/** Add a collaborator by email (owner only). */
export async function addCollaborator(
  documentId: string,
  email: string,
  role: "editor" | "viewer" = "editor",
) {
  const { supabase, user } = await requireUser();

  // Verify user is document owner
  const { data: doc, error: docError } = await supabase
    .from("documents")
    .select("owner_id")
    .eq("id", documentId)
    .single();

  if (docError || doc.owner_id !== user.id) {
    throw new Error("Only the document owner can add collaborators");
  }

  // Find user by email
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email)
    .single();

  if (profileError || !profile) {
    throw new Error("User not found");
  }

  // Add collaborator
  const { error: collabError } = await supabase.from("document_collaborators").insert({
    document_id: documentId,
    user_id: profile.id,
    role,
  });

  if (collabError) {
    if (collabError.code === "23505") {
      throw new Error("User is already a collaborator");
    }
    throw collabError;
  }

  revalidatePath(`/doc/${documentId}`);
}

/** Remove a collaborator from a document (owner only). */
export async function removeCollaborator(documentId: string, userId: string) {
  const { supabase, user } = await requireUser();

  const { data: doc, error: docError } = await supabase
    .from("documents")
    .select("owner_id")
    .eq("id", documentId)
    .single();

  if (docError || doc.owner_id !== user.id) {
    throw new Error("Only the document owner can remove collaborators");
  }

  const { error } = await supabase
    .from("document_collaborators")
    .delete()
    .eq("document_id", documentId)
    .eq("user_id", userId);

  if (error) throw error;
  revalidatePath(`/doc/${documentId}`);
}
