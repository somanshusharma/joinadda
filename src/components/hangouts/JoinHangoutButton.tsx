"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { joinHangout, leaveHangout } from "@/app/actions/hangout";

export function JoinHangoutButton({
  hangoutId,
  initialJoined,
  isFull,
  isHost,
  isCancelled,
  size = "md",
}: {
  hangoutId: string;
  initialJoined: boolean;
  isFull: boolean;
  isHost: boolean;
  isCancelled: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const [joined, setJoined] = useState(initialJoined);
  const [pending, startTransition] = useTransition();

  if (isCancelled)
    return (
      <Button disabled variant="outline" size={size}>
        Cancelled
      </Button>
    );

  if (isHost)
    return (
      <Button disabled variant="outline" size={size}>
        You&apos;re hosting
      </Button>
    );

  function toggle() {
    const prev = joined;
    setJoined(!prev);
    startTransition(async () => {
      const res = prev
        ? await leaveHangout(hangoutId)
        : await joinHangout(hangoutId);
      if (!res.ok) setJoined(prev);
    });
  }

  if (joined)
    return (
      <Button
        variant="outline"
        size={size}
        loading={pending}
        onClick={toggle}
      >
        Joined ✓
      </Button>
    );

  return (
    <Button
      size={size}
      loading={pending}
      disabled={isFull}
      onClick={toggle}
    >
      {isFull ? "Full" : "I'm in"}
    </Button>
  );
}
