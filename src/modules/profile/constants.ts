// Avatar upload limits — shared by the client form (instant validation) and the
// server action (authoritative re-check). Kept here, not in `actions.ts`, so the
// client can import them without pulling in a `"use server"` module.

export const MAX_AVATAR_MB = 2;
export const MAX_AVATAR_BYTES = MAX_AVATAR_MB * 1024 * 1024;
export const ALLOWED_AVATAR_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
