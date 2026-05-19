"use client";

import { useState, useTransition } from "react";
import { Ban } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { blockUser, unblockUser } from "@/app/actions/moderation";

export function BlockButton({
  targetId,
  initialBlocked,
}: {
  targetId: string;
  initialBlocked: boolean;
}) {
  const [blocked, setBlocked] = useState(initialBlocked);
  const [pending, startTransition] = useTransition();

  function onClick() {
    if (!blocked) {
      const ok = window.confirm("Block this person? You won't see each other anywhere.");
      if (!ok) return;
    }
    const prev = blocked;
    setBlocked(!prev);
    startTransition(async () => {
      const res = prev ? await unblockUser(targetId) : await blockUser(targetId);
      if (!res.ok) setBlocked(prev);
    });
  }

  return (
    <Button
      size="sm"
      variant="ghost"
      onClick={onClick}
      loading={pending}
      className="text-ink-muted hover:text-danger"
    >
      <Ban className="size-4" />
      {blocked ? "Unblock" : "Block"}
    </Button>
  );
}
