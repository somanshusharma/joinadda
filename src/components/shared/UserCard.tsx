import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { VibeTag } from "@/components/ui/VibeTag";
import { FollowButton } from "@/components/profile/FollowButton";

export type UserCardProfile = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  profession: string | null;
  company: string | null;
  vibe_tags: string[];
};

export function UserCard({
  profile,
  currentUserId,
  isFollowing,
  showFollow = true,
}: {
  profile: UserCardProfile;
  currentUserId: string | null;
  isFollowing?: boolean;
  showFollow?: boolean;
}) {
  const isSelf = currentUserId === profile.id;
  return (
    <div className="rounded-2xl border border-surface-border bg-surface-elevated p-5">
      <div className="flex items-start gap-3">
        <Link href={`/profile/${profile.username}`}>
          <Avatar
            name={profile.display_name}
            src={profile.avatar_url}
            seed={profile.id}
            size="lg"
          />
        </Link>
        <div className="min-w-0 flex-1">
          <Link
            href={`/profile/${profile.username}`}
            className="block truncate font-semibold text-ink hover:underline"
          >
            {profile.display_name}
          </Link>
          <p className="truncate text-xs text-ink-muted">@{profile.username}</p>
          {profile.profession ? (
            <p className="mt-1 truncate text-sm text-ink-secondary">
              {profile.profession}
              {profile.company ? ` · ${profile.company}` : ""}
            </p>
          ) : null}
        </div>
        {showFollow && !isSelf && currentUserId ? (
          <FollowButton
            targetId={profile.id}
            initialFollowing={!!isFollowing}
            size="sm"
          />
        ) : null}
      </div>
      {profile.vibe_tags?.length ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {profile.vibe_tags.slice(0, 4).map((v) => (
            <VibeTag key={v} label={v} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
