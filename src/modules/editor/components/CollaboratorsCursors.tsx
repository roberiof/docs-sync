"use client";

import { useEffect, useState } from "react";
import type { WebsocketProvider } from "y-websocket";

import type { User } from "@/lib/yjs/provider";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { UserAvatar } from "@/components/ui/user-avatar";

type Collaborator = User & {
  clientID: number;
};

type Props = {
  provider?: WebsocketProvider;
};

export function CollaboratorsCursors({ provider }: Props) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);

  useEffect(() => {
    if (!provider) return;

    const updateCollaborators = () => {
      const states = provider.awareness.getStates();
      // One entry per distinct person (same user across tabs shares a color +
      // name), not per connection — avoids duplicate avatars.
      const byUser = new Map<string, Collaborator>();

      states.forEach((state, clientID) => {
        const user = state.user as User | undefined;
        if (!user || clientID === provider.awareness.clientID) return;
        const key = `${user.color}|${user.name ?? ""}`;
        if (!byUser.has(key)) byUser.set(key, { ...user, clientID });
      });

      setCollaborators([...byUser.values()]);
    };

    updateCollaborators();

    provider.awareness.on("change", updateCollaborators);

    return () => {
      provider.awareness.off("change", updateCollaborators);
    };
  }, [provider]);

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
