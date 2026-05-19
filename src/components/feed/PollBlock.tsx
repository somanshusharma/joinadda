"use client";

import { useState, useTransition } from "react";
import { votePoll } from "@/app/actions/post";
import { cn } from "@/lib/utils";

export type PollOption = { index: number; label: string };

export function PollBlock({
  postId,
  options,
  voteCounts,
  initialMyVote,
}: {
  postId: string;
  options: PollOption[];
  voteCounts: Record<number, number>;
  initialMyVote: number | null;
}) {
  const [myVote, setMyVote] = useState<number | null>(initialMyVote);
  const [counts, setCounts] = useState<Record<number, number>>(voteCounts);
  const [pending, startTransition] = useTransition();

  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  function pick(idx: number) {
    if (pending) return;
    const prevVote = myVote;
    const nextCounts = { ...counts };
    if (prevVote !== null && prevVote !== idx) {
      nextCounts[prevVote] = Math.max(0, (nextCounts[prevVote] ?? 0) - 1);
    }
    if (prevVote !== idx) {
      nextCounts[idx] = (nextCounts[idx] ?? 0) + 1;
    }
    setMyVote(idx);
    setCounts(nextCounts);

    startTransition(async () => {
      const res = await votePoll(postId, idx);
      if (!res.ok) {
        setMyVote(prevVote);
        setCounts(counts);
      }
    });
  }

  return (
    <div className="mt-4 space-y-3">
      {options.map((opt) => {
        const c = counts[opt.index] ?? 0;
        const pct = total > 0 ? Math.round((c / total) * 100) : 0;
        const picked = myVote === opt.index;
        return (
          <button
            key={opt.index}
            type="button"
            onClick={() => pick(opt.index)}
            className={cn(
              "group relative flex w-full items-center justify-between gap-2 overflow-hidden rounded-2xl px-4 py-3 text-left transition",
              picked
                ? "border-2 border-primary-500 bg-primary-100 text-ink"
                : "border border-surface-border bg-surface-elevated hover:bg-surface-muted",
            )}
          >
            <span className={cn("relative z-10 text-base", picked && "font-semibold")}>
              {opt.label}
            </span>
            <span
              className={cn(
                "relative z-10 text-xs",
                picked
                  ? "text-primary-700"
                  : "text-ink-light group-hover:text-primary-600",
              )}
            >
              {pct}%
            </span>
          </button>
        );
      })}
      <p className="text-xs italic text-ink-muted">
        {total} {total === 1 ? "person voted" : "people voted"}
      </p>
    </div>
  );
}
