"use client";

import { useState, useTransition } from "react";
import { Check, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { followUser, unfollowUser } from "@/app/actions/follow";

export function FollowButton({
  targetId,
  initialFollowing,
  size = "md",
}: {
  targetId: string;
  initialFollowing: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const [following, setFollowing] = useState(initialFollowing);
  const [pending, startTransition] = useTransition();

  function onClick() {
    const prev = following;
    setFollowing(!prev);
    startTransition(async () => {
      const res = prev ? await unfollowUser(targetId) : await followUser(targetId);
      if (!res.ok) setFollowing(prev);
    });
  }

  return (
    <Button
      onClick={onClick}
      size={size}
      variant={following ? "outline" : "primary"}
      loading={pending}
    >
      {following ? (
        <>
          <Check className="size-4" /> Following
        </>
      ) : (
        <>
          <UserPlus className="size-4" /> Follow
        </>
      )}
    </Button>
  );
}
