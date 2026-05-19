"use client";

import { useState, useTransition } from "react";
import { Flag, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { reportEntity, type ReportEntity } from "@/app/actions/moderation";
import { cn } from "@/lib/utils";

const REASONS = [
  "Spam or scam",
  "Harassment or bullying",
  "Hate speech",
  "Inappropriate content",
  "Doesn't belong here",
  "Something else",
];

export function ReportButton({
  entityType,
  entityId,
  size = "sm",
  variant = "ghost",
  label = "Report",
}: {
  entityType: ReportEntity;
  entityId: string;
  size?: "sm" | "md";
  variant?: "ghost" | "outline";
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await reportEntity({ entityType, entityId, reason, notes });
      if (!res.ok) setError(res.error);
      else setDone(true);
    });
  }

  function close() {
    setOpen(false);
    setReason("");
    setNotes("");
    setDone(false);
    setError(null);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full text-xs font-medium transition",
          variant === "outline"
            ? "border border-surface-border bg-surface-elevated px-3 py-1.5 text-ink-secondary hover:border-danger"
            : "px-2 py-1 text-ink-muted hover:text-danger",
          size === "md" && "text-sm",
        )}
      >
        <Flag className="size-3.5" />
        {label}
      </button>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 md:items-center md:p-4"
          onClick={close}
        >
          <div
            className="w-full max-w-md rounded-t-3xl bg-surface-elevated p-5 shadow-lg md:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-extrabold tracking-tight">
                {done ? "Thanks for the heads-up" : "Report this"}
              </h2>
              <button
                type="button"
                onClick={close}
                aria-label="Close"
                className="grid size-8 place-items-center rounded-full text-ink-muted hover:bg-surface-muted"
              >
                <X className="size-5" />
              </button>
            </div>

            {done ? (
              <>
                <p className="mt-3 text-sm text-ink-secondary">
                  We&apos;ll take a look. Thanks for keeping things chill.
                </p>
                <div className="mt-5 flex justify-end">
                  <Button onClick={close}>Close</Button>
                </div>
              </>
            ) : (
              <>
                <p className="mt-2 text-sm text-ink-secondary">
                  What&apos;s up with it?
                </p>
                <div className="mt-3 space-y-1.5">
                  {REASONS.map((r) => (
                    <label
                      key={r}
                      className={cn(
                        "flex cursor-pointer items-center gap-2 rounded-2xl border p-3 text-sm transition",
                        reason === r
                          ? "border-primary-500 bg-primary-50"
                          : "border-surface-border bg-surface-elevated hover:border-primary-200",
                      )}
                    >
                      <input
                        type="radio"
                        name="reason"
                        value={r}
                        checked={reason === r}
                        onChange={() => setReason(r)}
                        className="size-4 accent-[var(--color-primary-500)]"
                      />
                      {r}
                    </label>
                  ))}
                </div>
                <div className="mt-3">
                  <Textarea
                    placeholder="Anything else we should know? (optional)"
                    maxLength={400}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="min-h-20"
                  />
                </div>
                {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
                <div className="mt-5 flex justify-end gap-2">
                  <Button variant="ghost" onClick={close}>
                    Cancel
                  </Button>
                  <Button onClick={submit} loading={pending} disabled={!reason}>
                    Send report
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
