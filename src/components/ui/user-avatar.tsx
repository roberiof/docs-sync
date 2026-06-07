import { cn } from "@/lib/utils";

type Props = {
  /** Display name — drives the fallback initial and the title attribute. */
  name: string;
  /** The user's stable color (see `getUserColor`) — used for the ring. */
  color: string;
  imageUrl?: string | null;
  /** Size of the inner avatar, e.g. "size-6" (default), "size-8", "size-9". */
  className?: string;
};

/**
 * Avatar with a colored ring identifying the user, matching the live presence
 * cursors. Shows the photo when available, otherwise the name initial.
 */
export function UserAvatar({ name, color, imageUrl, className }: Props) {
  return (
    <span
      className="inline-flex shrink-0 rounded-full p-0.5"
      style={{ backgroundColor: color }}
      title={name}
    >
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt={name}
          className={cn("block size-6 rounded-full object-cover", className)}
        />
      ) : (
        <span
          className={cn(
            "flex size-6 items-center justify-center rounded-full text-[0.65rem] font-semibold text-white",
            className,
          )}
          style={{ backgroundColor: color }}
        >
          {name[0]?.toUpperCase() ?? "?"}
        </span>
      )}
    </span>
  );
}
