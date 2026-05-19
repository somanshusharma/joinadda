"use client";

import { useState, useTransition } from "react";
import {
  voteOnHangoutPoll,
  deleteHangoutPoll,
} from "@/app/actions/hangoutPoll";
import { cn } from "@/lib/utils";

export type PollOption = { index: number; label: string };

export type HangoutPollView = {
  id: string;
  question: string;
  options: PollOption[];
  voteCounts: Record<number, number>;
  myVote: number | null;
  mine: boolean; // current user created this poll
  createdByName: string | null;
};

export function HangoutPollCard({
  poll,
  canVote,
}: {
  poll: HangoutPollView;
  canVote: boolean;
}) {
  const [myVote, setMyVote] = useState<number | null>(poll.myVote);
  const [counts, setCounts] = useState<Record<number, number>>(poll.voteCounts);
  const [deleted, setDeleted] = useState(false);
  const [pending, startTransition] = useTransition();

  if (deleted) return null;

  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  function pick(idx: number) {
    if (!canVote || pending) return;
    const prevVote = myVote;
    const next = { ...counts };
    if (prevVote !== null && prevVote !== idx) {
      next[prevVote] = Math.max(0, (next[prevVote] ?? 0) - 1);
    }
    if (prevVote !== idx) {
      next[idx] = (next[idx] ?? 0) + 1;
    }
    setMyVote(idx);
    setCounts(next);

    startTransition(async () => {
      const res = await voteOnHangoutPoll(poll.id, idx);
      if (!res.ok) {
        setMyVote(prevVote);
        setCounts(counts);
      }
    });
  }

  function remove() {
    if (!poll.mine || pending) return;
    if (!window.confirm("Delete this poll?")) return;
    setDeleted(true);
    startTransition(async () => {
      const res = await deleteHangoutPoll(poll.id);
      if (!res.ok) setDeleted(false);
    });
  }

  return (
    <article className="rounded-2xl border border-surface-border bg-white p-5 sun-kissed-shadow">
      <header className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <h4 className="font-display text-base font-semibold text-ink leading-snug">
            {poll.question}
          </h4>
          {poll.createdByName ? (
            <p className="text-xs text-ink-muted mt-0.5">
              by {poll.createdByName}
              {total > 0
                ? ` · ${total} ${total === 1 ? "vote" : "votes"}`
                : " · no votes yet"}
            </p>
          ) : null}
        </div>
        {poll.mine ? (
          <button
            type="button"
            onClick={remove}
            disabled={pending}
            aria-label="Delete poll"
            className="grid size-7 place-items-center rounded-full text-ink-muted hover:bg-surface-muted hover:text-danger transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">
              close
            </span>
          </button>
        ) : null}
      </header>

      <div className="space-y-2">
        {poll.options.map((opt) => {
          const c = counts[opt.index] ?? 0;
          const pct = total > 0 ? Math.round((c / total) * 100) : 0;
          const picked = myVote === opt.index;
          return (
            <button
              key={opt.index}
              type="button"
              onClick={() => pick(opt.index)}
              disabled={!canVote || pending}
              className={cn(
                "group relative flex w-full items-center justify-between gap-3 overflow-hidden rounded-xl px-4 py-2.5 text-left transition-all",
                picked
                  ? "border-2 border-primary-500 bg-primary-100"
                  : "border border-surface-border bg-surface-low hover:border-primary-200",
                !canVote && "cursor-default",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "absolute inset-y-0 left-0 transition-[width] duration-300",
                  picked ? "bg-primary-200/60" : "bg-surface-muted",
                )}
                style={{ width: `${pct}%` }}
              />
              <span
                className={cn(
                  "relative z-10 text-sm",
                  picked ? "font-semibold text-primary-700" : "text-ink",
                )}
              >
                {opt.label}
              </span>
              <span
                className={cn(
                  "relative z-10 text-xs",
                  picked ? "text-primary-700 font-semibold" : "text-ink-muted",
                )}
              >
                {pct}%
              </span>
            </button>
          );
        })}
      </div>

      {!canVote ? (
        <p className="mt-3 text-[11px] text-ink-muted italic">
          Join the hangout to vote.
        </p>
      ) : null}
    </article>
  );
}
