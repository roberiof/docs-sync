import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { UserAvatar } from "@/components/ui/user-avatar";

type Props = {
  ownerName: string | null;
  ownerEmail: string;
  ownerColor: string;
  ownerAvatarUrl?: string | null;
};

/** Shown to non-owners: a compact chip naming who shared the document. */
export function GuestBanner({ ownerName, ownerEmail, ownerColor, ownerAvatarUrl }: Props) {
  const name = ownerName?.trim() || ownerEmail.split("@")[0];

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <div className="border-border flex cursor-default items-center gap-2 rounded-full border bg-white py-1 pr-3 pl-1.5 text-sm shadow-sm">
            <UserAvatar
              name={name}
              color={ownerColor}
              imageUrl={ownerAvatarUrl}
              className="size-6"
            />
            <span className="text-muted-foreground">
              Shared by <span className="text-foreground font-medium">{name}</span>
            </span>
            <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-[0.6rem] font-semibold tracking-wide uppercase">
              Guest
            </span>
          </div>
        }
      />
      <TooltipContent>{ownerEmail}</TooltipContent>
    </Tooltip>
  );
}
