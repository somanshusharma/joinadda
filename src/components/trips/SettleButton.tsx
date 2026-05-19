"use client";

import { useState, useTransition } from "react";
import { recordSettlement } from "@/app/actions/expense";

export function SettleButton({
  eventId,
  fromId,
  toId,
  amountInr,
  canRecord,
}: {
  eventId: string;
  fromId: string;
  toId: string;
  amountInr: number;
  canRecord: boolean;
}) {
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!canRecord) return null;

  function go() {
    setError(null);
    startTransition(async () => {
      const res = await recordSettlement({
        eventId,
        fromId,
        toId,
        amountInr,
      });
      if (!res.ok) setError(res.error ?? "Failed");
      else setDone(true);
    });
  }

  if (done)
    return (
      <span className="text-xs font-bold text-success">marked paid ✓</span>
    );

  return (
    <button
      type="button"
      onClick={go}
      disabled={pending}
      className="text-xs font-semibold text-primary-600 hover:underline disabled:opacity-60"
      title={error ?? undefined}
    >
      {pending ? "saving…" : "Mark paid back"}
    </button>
  );
}
