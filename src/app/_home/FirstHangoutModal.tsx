"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { X, Sparkles } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { joinHangout } from "@/app/actions/hangout";

export type WelcomeHangout = {
  id: string;
  activity: string;
  time_window: string;
  location: string;
  joiner_count: number;
  max_joiners: number;
  host: {
    id: string;
    display_name: string;
    avatar_url: string | null;
  } | null;
};

export function FirstHangoutModal({
  hangouts,
}: {
  hangouts: WelcomeHangout[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(true);
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set());
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [_, startTransition] = useTransition();

  function dismiss() {
    setOpen(false);
    // Remove ?welcome=1 from the URL without scroll/reload.
    router.replace("/", { scroll: false });
  }

  function join(id: string) {
    setPendingId(id);
    startTransition(async () => {
      const res = await joinHangout(id);
      setPendingId(null);
      if (res.ok) {
        setJoinedIds((prev) => new Set(prev).add(id));
      }
    });
  }

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 md:items-center md:p-4"
      onClick={dismiss}
    >
      <div
        className="w-full max-w-lg rounded-t-3xl bg-surface-elevated p-6 shadow-2xl md:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="font-sticker text-lg text-primary-600 -rotate-2 inline-block">
              welcome 👋
            </span>
            <h2 className="mt-1 font-serif text-2xl font-semibold tracking-tight text-ink">
              One last thing — say yes to a plan.
            </h2>
            <p className="mt-1.5 text-sm text-ink-secondary">
              Pick a hangout in your city. Strangers become friends 30 seconds
              after you tap &ldquo;I&apos;m in&rdquo;.
            </p>
          </div>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Close"
            className="grid size-8 place-items-center rounded-full text-ink-muted hover:bg-surface-muted shrink-0"
          >
            <X className="size-5" />
          </button>
        </div>

        {hangouts.length === 0 ? (
          <div className="mt-6 text-center">
            <Sparkles className="mx-auto size-8 text-primary-400 mb-2" />
            <p className="text-sm text-ink-secondary">
              No hangouts in your city yet — be the first to plan one.
            </p>
            <Link
              href="/hangouts/new"
              onClick={dismiss}
              className="mt-4 inline-flex items-center gap-2 bg-primary-500 text-white font-bold text-sm px-5 py-2.5 rounded-full"
            >
              Plan a hangout
            </Link>
          </div>
        ) : (
          <ul className="mt-5 space-y-3">
            {hangouts.map((h) => {
              const joined = joinedIds.has(h.id);
              const pending = pendingId === h.id;
              const firstName = h.host?.display_name.split(" ")[0] ?? "Someone";
              return (
                <li
                  key={h.id}
                  className="bg-white border border-surface-border rounded-2xl p-4 flex items-center gap-3"
                >
                  {h.host ? (
                    <Avatar
                      name={h.host.display_name}
                      src={h.host.avatar_url}
                      seed={h.host.id}
                      size="sm"
                    />
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink truncate">
                      {firstName.toLowerCase()} wants to{" "}
                      <span className="text-primary-600">{h.activity}</span>
                    </p>
                    <p className="text-xs text-ink-muted truncate">
                      {h.time_window} · {h.location}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => join(h.id)}
                    disabled={joined || pending}
                    className={
                      "shrink-0 rounded-full px-4 py-2 text-xs font-bold transition active:scale-95 disabled:opacity-50 " +
                      (joined
                        ? "bg-surface-muted text-ink-secondary"
                        : "bg-primary-500 text-white hover:bg-primary-600")
                    }
                  >
                    {joined ? "joined ✓" : pending ? "…" : "I'm in"}
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={dismiss}
            className="text-sm font-semibold text-ink-muted hover:text-ink py-2"
          >
            {joinedIds.size > 0
              ? "Take me to the home →"
              : "Just take me home"}
          </button>
        </div>
      </div>
    </div>
  );
}
