"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProfileForm } from "@/modules/profile/components/ProfileForm";

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
