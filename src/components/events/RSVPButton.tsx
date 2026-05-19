"use client";

import { useState, useTransition } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { setRsvp } from "@/app/actions/event";
import type { RsvpStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export function RSVPButton({
  eventId,
  initialStatus,
  full,
  cancelled,
}: {
  eventId: string;
  initialStatus: RsvpStatus | null;
  full?: boolean;
  cancelled?: boolean;
}) {
  const [status, setStatus] = useState<RsvpStatus | null>(initialStatus);
  const [pending, startTransition] = useTransition();

  function set(next: RsvpStatus | null) {
    const prev = status;
    setStatus(next);
    startTransition(async () => {
      const res = await setRsvp(eventId, next);
      if (!res.ok) setStatus(prev);
    });
  }

  if (cancelled) {
    return (
      <Button disabled variant="outline">
        Event cancelled
      </Button>
    );
  }

  if (status === "going") {
    return (
      <div className="flex items-center gap-2">
        <Button variant="outline" loading={pending}>
          <Check className="size-4" /> Going
        </Button>
        <button
          type="button"
          onClick={() => set(null)}
          className="text-xs text-ink-muted hover:text-danger"
        >
          Can&apos;t make it
        </button>
      </div>
    );
  }

  if (status === "maybe") {
    return (
      <div className="flex items-center gap-2">
        <Button variant="outline" loading={pending} onClick={() => set("going")}>
          Confirm going
        </Button>
        <button
          type="button"
          onClick={() => set(null)}
          aria-label="Remove maybe"
          className="grid size-9 place-items-center rounded-full text-ink-muted hover:text-danger"
        >
          <X className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        onClick={() => set("going")}
        loading={pending}
        disabled={full}
        className={cn(full && "opacity-60")}
      >
        {full ? "Full" : "I'm going"}
      </Button>
      <Button variant="outline" onClick={() => set("maybe")} disabled={pending}>
        Maybe
      </Button>
    </div>
  );
}
