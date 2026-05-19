"use client";

import { useState, useTransition } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { toggleMetAt } from "@/app/actions/metAt";
import { cn } from "@/lib/utils";

export type MetCandidate = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
};

export function MetAtPanel({
  contextType,
  contextId,
  candidates,
  initialTagged,
}: {
  contextType: "hangout" | "event";
  contextId: string;
  candidates: MetCandidate[];
  initialTagged: string[];
}) {
  const [tagged, setTagged] = useState<Set<string>>(new Set(initialTagged));
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [_, startTransition] = useTransition();

  function toggle(metId: string) {
    const wasTagged = tagged.has(metId);
    const next = new Set(tagged);
    if (wasTagged) next.delete(metId);
    else next.add(metId);
    setTagged(next);
    setPendingId(metId);
    startTransition(async () => {
      const res = await toggleMetAt({ metId, contextType, contextId });
      setPendingId(null);
      if (!res.ok) {
        // Roll back
        setTagged((cur) => {
          const r = new Set(cur);
          if (wasTagged) r.add(metId);
          else r.delete(metId);
          return r;
        });
      }
    });
  }

  if (candidates.length === 0) return null;

  return (
    <section className="rounded-3xl border-2 border-dashed border-primary-200/60 bg-peach/20 p-6">
      <p className="font-sticker text-lg text-primary-700 -rotate-2 inline-block mb-1">
        how did it go?
      </p>
      <h3 className="font-display text-xl font-semibold text-ink mb-1">
        Tag the people you actually met
      </h3>
      <p className="text-sm text-ink-secondary mb-5">
        Quick tap. Builds real social signal — a small &ldquo;met at&rdquo;
        badge appears on their profile.
      </p>

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
        {candidates.map((p) => {
          const isTagged = tagged.has(p.id);
          const isPending = pendingId === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => toggle(p.id)}
              disabled={isPending}
              className={cn(
                "flex flex-col items-center gap-2 group transition-transform active:scale-95",
              )}
            >
              <div
                className={cn(
                  "relative rounded-full ring-2 transition-all",
                  isTagged
                    ? "ring-primary-500"
                    : "ring-transparent group-hover:ring-primary-200",
                )}
              >
                <Avatar
                  name={p.display_name}
                  src={p.avatar_url}
                  seed={p.id}
                  size="lg"
                />
                {isTagged ? (
                  <span
                    className="absolute -top-1 -right-1 bg-primary-500 text-white rounded-full grid place-items-center size-6 border-2 border-white"
                    aria-label="Tagged"
                  >
                    <span
                      className="material-symbols-outlined text-[14px]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      check
                    </span>
                  </span>
                ) : null}
              </div>
              <span className="text-xs font-medium text-ink line-clamp-1">
                {p.display_name.split(" ")[0]}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
