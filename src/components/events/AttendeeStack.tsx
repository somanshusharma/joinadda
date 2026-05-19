import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";

export type AttendeePreview = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
};

export function AttendeeStack({
  attendees,
  total,
  size = "sm",
  max = 4,
}: {
  attendees: AttendeePreview[];
  total: number;
  size?: "xs" | "sm" | "md";
  max?: number;
}) {
  const visible = attendees.slice(0, max);
  const overflow = Math.max(0, total - visible.length);

  return (
    <div className="flex items-center">
      <div className="flex -space-x-2">
        {visible.map((a) => (
          <Link key={a.id} href={`/profile/${a.username}`} className="block">
            <Avatar
              name={a.display_name}
              src={a.avatar_url}
              seed={a.id}
              size={size}
              className="ring-2 ring-surface-elevated"
            />
          </Link>
        ))}
        {overflow > 0 ? (
          <span
            className="grid size-8 place-items-center rounded-full bg-surface-muted text-[10px] font-semibold text-ink-secondary ring-2 ring-surface-elevated"
            aria-label={`${overflow} more attendees`}
          >
            +{overflow}
          </span>
        ) : null}
      </div>
      <span className="ml-2 text-xs text-ink-muted">
        {total} going
      </span>
    </div>
  );
}
