"use client";

import { LogOut } from "lucide-react";
import Link from "next/link";
import { useTransition } from "react";

import { BrandMark } from "@/components/BrandMark";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

type Props = {
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
};

export function TopBar({ name, email, avatarUrl }: Props) {
  const [pending, startTransition] = useTransition();
  const label = name || email || "Account";
  const initial = label.charAt(0).toUpperCase();

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
            <Avatar className="size-9">
              {avatarUrl && <AvatarImage src={avatarUrl} alt={label} />}
              <AvatarFallback className="bg-ultramarine-100 text-primary text-sm font-semibold">
                {initial}
              </AvatarFallback>
            </Avatar>
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
      </div>
    </header>
  );
}
