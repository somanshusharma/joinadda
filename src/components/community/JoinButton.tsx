"use client";

import { useState, useTransition } from "react";
import { Check, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { joinCommunity, leaveCommunity } from "@/app/actions/community";

export function JoinButton({
  communityId,
  initialJoined,
  size = "sm",
}: {
  communityId: string;
  initialJoined: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const [joined, setJoined] = useState(initialJoined);
  const [pending, startTransition] = useTransition();

  function onClick() {
    const prev = joined;
    setJoined(!prev);
    startTransition(async () => {
      const res = prev
        ? await leaveCommunity(communityId)
        : await joinCommunity(communityId);
      if (!res.ok) setJoined(prev);
    });
  }

  return (
    <Button
      onClick={onClick}
      size={size}
      variant={joined ? "outline" : "primary"}
      loading={pending}
    >
      {joined ? (
        <>
          <Check className="size-4" /> Joined
        </>
      ) : (
        <>
          <Plus className="size-4" /> Join
        </>
      )}
    </Button>
  );
}
