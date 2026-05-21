"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { joinHangout, leaveHangout } from "@/app/actions/hangout";

export type JoinerStatus =
  | "none"
  | "pending"
  | "going"
  | "declined"
  | "cancelled";

export function JoinHangoutButton({
  hangoutId,
  initialStatus,
  isFull,
  isHost,
  isCancelled,
  requiresApproval,
  size = "md",
}: {
  hangoutId: string;
  initialStatus: JoinerStatus;
  isFull: boolean;
  isHost: boolean;
  isCancelled: boolean;
  requiresApproval: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const [status, setStatus] = useState<JoinerStatus>(initialStatus);
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

  if (status === "declined") {
    return (
      <Button disabled variant="outline" size={size}>
        Not accepted
      </Button>
    );
  }

  function join() {
    const prev = status;
    setStatus(requiresApproval ? "pending" : "going");
    startTransition(async () => {
      const res = await joinHangout(hangoutId);
      if (!res.ok) setStatus(prev);
      else if (res.status) setStatus(res.status as JoinerStatus);
    });
  }

  function leave() {
    const prev = status;
    setStatus("none");
    startTransition(async () => {
      const res = await leaveHangout(hangoutId);
      if (!res.ok) setStatus(prev);
    });
  }

  if (status === "going") {
    return (
      <Button variant="outline" size={size} loading={pending} onClick={leave}>
        Joined ✓
      </Button>
    );
  }

  if (status === "pending") {
    return (
      <Button variant="outline" size={size} loading={pending} onClick={leave}>
        Request sent · pending
      </Button>
    );
  }

  return (
    <Button size={size} loading={pending} disabled={isFull} onClick={join}>
      {isFull
        ? "Full"
        : requiresApproval
          ? "Request to join"
          : "I'm in"}
    </Button>
  );
}
