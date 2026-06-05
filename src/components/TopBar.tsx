"use client";

import { LogOut, UserPen } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";

import { BrandMark } from "@/components/BrandMark";
import { UserAvatar } from "@/components/ui/user-avatar";
import { getUserColor } from "@/lib/utils/colors";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "@/modules/auth/actions";
import { EditProfileDialog } from "@/modules/profile/components/EditProfileDialog";

type Props = {
  userId: string;
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
};

export function TopBar({ userId, name, email, avatarUrl }: Props) {
  const [pending, startTransition] = useTransition();
  const [editOpen, setEditOpen] = useState(false);
  const label = name || email || "Account";

  return (
    <header className="border-border bg-background/80 sticky top-0 z-20 border-b backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
        <Link href="/dashboard" className="text-foreground flex items-center gap-2.5">
          <BrandMark className="size-8" />
          <span className="font-serif text-xl tracking-tight">DocSync</span>
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="Account menu"
            className="ring-offset-background focus-visible:ring-ring rounded-full focus-visible:ring-2 focus-visible:outline-none"
          >
            <UserAvatar
              name={label}
              color={getUserColor(userId)}
              imageUrl={avatarUrl}
              className="size-9 text-sm"
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel>
                <p className="text-foreground truncate font-medium">{label}</p>
                {email && name && (
                  <p className="text-muted-foreground truncate text-xs font-normal">{email}</p>
                )}
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setEditOpen(true)}>
              <UserPen className="size-4" />
              Edit profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              disabled={pending}
              onClick={() => startTransition(() => signOut())}
            >
              <LogOut className="size-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <EditProfileDialog
          userId={userId}
          name={name}
          email={email}
          avatarUrl={avatarUrl}
          open={editOpen}
          onOpenChange={setEditOpen}
        />
      </div>
    </header>
  );
}
