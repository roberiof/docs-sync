"use client";

import { useEffect, useState } from "react";
import type { SupabaseProvider } from "@/lib/yjs/supabase-provider";

import type { User } from "@/lib/yjs/provider";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { UserAvatar } from "@/components/ui/user-avatar";

type Collaborator = User & {
  clientID: number;
  lastUpdated: number;
};

type Props = {
  provider?: SupabaseProvider;
  currentUser?: User;
};

export function CollaboratorsCursors({ provider, currentUser }: Props) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);

  useEffect(() => {
    if (!provider) return;

    const updateCollaborators = () => {
      const states = provider.awareness.getStates();
      const meta = provider.awareness.meta;
      // One entry per distinct person (same user across tabs/sessions shares a
      // color + name), not per connection — avoids duplicate avatars. When the
      // same person has multiple entries (e.g. a stale ghost from a previous
      // session lingering next to the live one), keep the freshest by
      // `lastUpdated` so a dead connection never masks the active one.
      const byUser = new Map<string, Collaborator>();

      states.forEach((state, clientID) => {
        const user = state.user as User | undefined;
        if (!user || clientID === provider.awareness.clientID) return;
        if (currentUser?.name && user.name === currentUser.name) return;
        const key = `${user.color}|${user.name ?? ""}`;
        const lastUpdated = meta.get(clientID)?.lastUpdated ?? clientID;
        const existing = byUser.get(key);
        if (!existing || lastUpdated > existing.lastUpdated) {
          byUser.set(key, { ...user, clientID, lastUpdated });
        }
      });

      setCollaborators([...byUser.values()]);
    };

    updateCollaborators();

    provider.awareness.on("change", updateCollaborators);

    return () => {
      provider.awareness.off("change", updateCollaborators);
    };
  }, [provider, currentUser]);

  if (!collaborators.length) return null;

  // Inline avatar pile, meant to sit inside the editor toolbar row. Each viewer
  // gets a ring in their own color — the "who's here" marker.
  return (
    <div className="flex -space-x-2">
      {collaborators.map((collab) => (
        <Tooltip key={collab.clientID}>
          <TooltipTrigger
            render={
              <UserAvatar
                name={collab.name || "Anonymous"}
                color={collab.color}
                imageUrl={collab.avatarUrl}
                className="size-6 cursor-default"
              />
            }
          />
          <TooltipContent>{collab.name || "Anonymous"}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}
