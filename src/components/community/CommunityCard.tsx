import Link from "next/link";
import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { JoinButton } from "./JoinButton";

export type CommunityCardData = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  member_count: number;
};

export function CommunityCard({
  community,
  joined,
  showJoin = true,
}: {
  community: CommunityCardData;
  joined: boolean;
  showJoin?: boolean;
}) {
  const Icon = ((community.icon && (Icons as unknown as Record<string, LucideIcon>)[community.icon]) ||
    Icons.Users) as LucideIcon;
  return (
    <div className="rounded-2xl border border-surface-border bg-surface-elevated p-5">
      <div className="flex items-start gap-3">
        <div className="grid size-11 place-items-center rounded-2xl bg-primary-100 text-primary-700">
          <Icon className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <Link
            href={`/communities/${community.slug}`}
            className="block truncate font-semibold text-ink hover:underline"
          >
            {community.name}
          </Link>
          <p className="text-xs text-ink-muted">{community.member_count} members</p>
        </div>
        {showJoin ? (
          <JoinButton communityId={community.id} initialJoined={joined} />
        ) : null}
      </div>
      {community.description ? (
        <p className="mt-3 line-clamp-2 text-sm text-ink-secondary">
          {community.description}
        </p>
      ) : null}
    </div>
  );
}
