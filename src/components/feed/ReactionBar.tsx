"use client";

import { useState, useTransition } from "react";
import { REACTION_TYPES } from "@/lib/config";
import { toggleReaction } from "@/app/actions/post";
import { cn } from "@/lib/utils";

type ReactionType = (typeof REACTION_TYPES)[number];

const ICON: Record<ReactionType, string> = {
  relatable: "back_hand",
  funny: "sentiment_very_satisfied",
  fire: "local_fire_department",
  mood: "mood",
  heart: "favorite",
};

const FILLED_COLOR: Record<ReactionType, string> = {
  relatable: "text-primary-600",
  funny: "text-amber-600",
  fire: "text-red-500",
  mood: "text-violet-600",
  heart: "text-rose-500",
};

export function ReactionBar({
  postId,
  initialCounts,
  initialMine,
}: {
  postId: string;
  initialCounts: Record<string, number>;
  initialMine: ReactionType[];
}) {
  const [counts, setCounts] = useState<Record<string, number>>(initialCounts);
  const [mine, setMine] = useState<Set<ReactionType>>(new Set(initialMine));
  const [pending, startTransition] = useTransition();

  function onTap(type: ReactionType) {
    const wasMine = mine.has(type);
    const nextMine = new Set(mine);
    if (wasMine) nextMine.delete(type);
    else nextMine.add(type);
    setMine(nextMine);
    setCounts((c) => ({
      ...c,
      [type]: Math.max(0, (c[type] ?? 0) + (wasMine ? -1 : 1)),
    }));

    startTransition(async () => {
      const res = await toggleReaction(postId, type);
      if (!res.ok) {
        setMine(mine);
        setCounts(counts);
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {REACTION_TYPES.map((t) => {
        const active = mine.has(t);
        const count = counts[t] ?? 0;
        return (
          <button
            key={t}
            type="button"
            disabled={pending}
            onClick={() => onTap(t)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition",
              active
                ? "bg-primary-100 text-primary-700"
                : "bg-surface-muted text-ink-secondary hover:bg-primary-50",
            )}
            aria-pressed={active}
          >
            <span
              className={cn(
                "material-symbols-outlined text-[18px] leading-none",
                active ? FILLED_COLOR[t] : "",
              )}
              style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              {ICON[t]}
            </span>
            {count > 0 ? <span>{count}</span> : null}
          </button>
        );
      })}
    </div>
  );
}
