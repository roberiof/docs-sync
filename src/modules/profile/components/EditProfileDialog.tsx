"use client";

import { Camera, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserAvatar } from "@/components/ui/user-avatar";
import { getUserColor } from "@/lib/utils/colors";
import { updateProfile } from "@/modules/profile/actions";
import { ALLOWED_AVATAR_TYPES, MAX_AVATAR_BYTES, MAX_AVATAR_MB } from "@/modules/profile/constants";

type Props = {
  userId: string;
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function EditProfileDialog({ open, onOpenChange, ...profile }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>Update your display name and photo.</DialogDescription>
        </DialogHeader>
        {/* Mounted fresh on each open, so its state starts from current props. */}
        {open && <ProfileForm {...profile} onClose={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

type FormProps = {
  userId: string;
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
  onClose: () => void;
};

function ProfileForm({ userId, name, email, avatarUrl, onClose }: FormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fullName, setFullName] = useState(name ?? "");
  const [preview, setPreview] = useState<string | null>(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Release the object URL when it changes or the form unmounts.
  useEffect(() => () => void (preview && URL.revokeObjectURL(preview)), [preview]);

  const label = fullName || email || "Account";
  // A pending removal wins over the stored photo; a freshly picked file wins over both.
  const shownAvatar = preview ?? (removeAvatar ? null : avatarUrl);

  function pickFile(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.target;
    const file = input.files?.[0];
    if (!file) return;

    // Validate before previewing/uploading — gives instant feedback and keeps an
    // oversized body from ever hitting the Server Action's size limit.
    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      setError("Image must be PNG, JPEG, WebP, or GIF.");
      input.value = "";
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setError(`Image is too large — must be ${MAX_AVATAR_MB} MB or smaller.`);
      input.value = "";
      return;
    }

    setError(null);
    setRemoveAvatar(false);
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  }

  function clearPhoto() {
    setError(null);
    setRemoveAvatar(true);
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const formData = new FormData(event.currentTarget);
      formData.set("remove_avatar", removeAvatar ? "1" : "0");
      const result = await updateProfile(formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      router.refresh();
      onClose();
    } catch {
      // Network failure, or the Server Action rejected (e.g. body too large).
      setError("Couldn't save your changes. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="group focus-visible:ring-ring relative rounded-full focus-visible:ring-2 focus-visible:outline-none"
          aria-label="Change photo"
        >
          <UserAvatar
            name={label}
            color={getUserColor(userId)}
            imageUrl={shownAvatar}
            className="size-16 text-xl"
          />
          <span className="absolute inset-0.5 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
            <Camera className="size-5 text-white" />
          </span>
        </button>
        <div className="text-muted-foreground text-xs">
          <p className="text-foreground font-medium">Profile photo</p>
          <p>PNG, JPEG, WebP or GIF — up to {MAX_AVATAR_MB}&nbsp;MB.</p>
          {shownAvatar && (
            <button
              type="button"
              onClick={clearPhoto}
              disabled={saving}
              className="text-destructive mt-1 font-medium hover:underline disabled:opacity-50"
            >
              Remove photo
            </button>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          name="avatar"
          accept="image/png,image/jpeg,image/webp,image/gif"
          onChange={pickFile}
          className="hidden"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="full_name">Display name</Label>
        <Input
          id="full_name"
          name="full_name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Your name"
          autoComplete="name"
          disabled={saving}
        />
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm">
          {error}
        </div>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving || !fullName.trim()}>
          {saving && <Loader2 className="size-4 animate-spin" />}
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </DialogFooter>
    </form>
  );
}
