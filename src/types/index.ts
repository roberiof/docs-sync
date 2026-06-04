/**
 * Shared domain types, derived from the generated DB row types.
 * Keep app code depending on these, not on raw DB shapes.
 */
import type { CollaboratorRole, Database } from "@/lib/supabase/types";

type Tables = Database["public"]["Tables"];

export type Profile = Tables["profiles"]["Row"];
export type Document = Tables["documents"]["Row"];
export type DocumentCollaborator = Tables["document_collaborators"]["Row"];

export type { CollaboratorRole };

/** Document row joined with the owner's public profile (for the dashboard). */
export type DocumentWithOwner = Document & {
  owner: Pick<Profile, "id" | "full_name" | "avatar_url"> | null;
};

/** A collaborator joined with their public profile (for cursors / share UI). */
export type CollaboratorWithProfile = DocumentCollaborator & {
  profile: Pick<Profile, "id" | "full_name" | "avatar_url" | "email"> | null;
};
