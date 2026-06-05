"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { ALLOWED_AVATAR_TYPES, MAX_AVATAR_BYTES, MAX_AVATAR_MB } from "@/modules/profile/constants";

export type ProfileUpdateState = { error?: string } | undefined;

/**
 * Update the signed-in user's display name and (optionally) avatar.
 * Reachable by direct POST, so it verifies the session and re-validates input;
 * Storage RLS additionally confines uploads to the user's own folder.
 */
export async function updateProfile(formData: FormData): Promise<ProfileUpdateState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You are not signed in." };

  const fullName = String(formData.get("full_name") ?? "").trim();
  if (!fullName) return { error: "Name cannot be empty." };

  const update: { full_name: string; avatar_url?: string | null } = { full_name: fullName };

  const file = formData.get("avatar");
  const removeAvatar = formData.get("remove_avatar") === "1";

  if (file instanceof File && file.size > 0) {
    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      return { error: "Image must be PNG, JPEG, WebP, or GIF." };
    }
    if (file.size > MAX_AVATAR_BYTES) {
      return { error: `Image must be ${MAX_AVATAR_MB} MB or smaller.` };
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
    // Folder = user id → the Storage RLS policy permits the write.
    const path = `${user.id}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (uploadError) return { error: "Failed to upload image." };

    update.avatar_url = supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
  } else if (removeAvatar) {
    update.avatar_url = null;
    // Best-effort cleanup of the user's stored files (RLS limits this to their
    // own folder). A failure here doesn't block clearing the profile column.
    const { data: stored } = await supabase.storage.from("avatars").list(user.id);
    if (stored?.length) {
      await supabase.storage.from("avatars").remove(stored.map((f) => `${user.id}/${f.name}`));
    }
  }

  const { error } = await supabase.from("profiles").update(update).eq("id", user.id);
  if (error) return { error: "Failed to save profile." };

  // The app layout reads the profile per request to render the top bar.
  revalidatePath("/", "layout");
  return undefined;
}
