"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { approveJoiner, declineJoiner } from "@/app/actions/hangout";

export type PendingRequester = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  profession: string | null;
  avg_rating: number | null;
  review_count: number | null;
};

export function PendingRequests({
  hangoutId,
  requesters,
}: {
  hangoutId: string;
  requesters: PendingRequester[];
}) {
  const [items, setItems] = useState(requesters);

  if (items.length === 0) return null;

  return (
    <section className="mt-8 bg-white border border-surface-border rounded-3xl p-5 md:p-6 sun-kissed-shadow">
      <div className="flex items-center gap-2 mb-4">
        <span className="material-symbols-outlined text-primary-600">
          how_to_reg
        </span>
        <h3 className="font-display text-lg font-bold text-ink">
          Pending requests{" "}
          <span className="text-ink-muted font-normal">({items.length})</span>
        </h3>
      </div>
      <p className="text-xs text-ink-muted mb-4">
        Tap a profile to check them out before you decide.
      </p>
      <ul className="space-y-2">
        {items.map((r) => (
          <RequestRow
            key={r.id}
            hangoutId={hangoutId}
            req={r}
            onResolve={(id) => setItems((cur) => cur.filter((x) => x.id !== id))}
          />
        ))}
      </ul>
    </section>
  );
}

function RequestRow({
  hangoutId,
  req,
  onResolve,
}: {
  hangoutId: string;
  req: PendingRequester;
  onResolve: (id: string) => void;
}) {
  const [pending, startTransition] = useTransition();

  function approve() {
    startTransition(async () => {
      const res = await approveJoiner(hangoutId, req.id);
      if (res.ok) onResolve(req.id);
    });
  }
  function decline() {
    startTransition(async () => {
      const res = await declineJoiner(hangoutId, req.id);
      if (res.ok) onResolve(req.id);
    });
  }

  return (
    <li className="flex items-center gap-3 p-3 rounded-2xl bg-surface-low border border-surface-border">
      <Link
        href={`/profile/${req.username}`}
        className="flex items-center gap-3 min-w-0 flex-1 group"
      >
        <Avatar
          name={req.display_name}
          src={req.avatar_url}
          seed={req.id}
          size="md"
        />
        <div className="min-w-0">
          <p className="font-semibold text-ink truncate group-hover:text-primary-600 transition">
            {req.display_name}
          </p>
          <p className="text-xs text-ink-muted truncate flex items-center gap-1.5">
            {req.profession ?? `@${req.username}`}
            {req.avg_rating != null && (req.review_count ?? 0) > 0 ? (
              <>
                <span>·</span>
                <span className="inline-flex items-center gap-0.5 text-mango-500">
                  <span className="material-symbols-outlined text-[14px]">
                    star
                  </span>
                  <span className="font-semibold text-ink">
                    {req.avg_rating.toFixed(1)}
                  </span>
                  <span className="text-ink-muted">({req.review_count})</span>
                </span>
              </>
            ) : null}
          </p>
        </div>
      </Link>
      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={decline}
          disabled={pending}
          aria-label="Decline"
          className="size-9 rounded-full grid place-items-center text-ink-muted hover:bg-danger/10 hover:text-danger transition disabled:opacity-50"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
        <button
          type="button"
          onClick={approve}
          disabled={pending}
          aria-label="Approve"
          className="size-9 rounded-full grid place-items-center bg-primary-500 text-white hover:bg-primary-600 transition disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[20px]">check</span>
        </button>
      </div>
    </li>
  );
}
