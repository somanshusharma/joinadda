"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, Heart, Home, X } from "lucide-react";

const STORAGE_KEY = "adda:v2:welcome-seen";

export function WelcomeModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (!window.localStorage.getItem(STORAGE_KEY)) {
        // Defer a tick so the page paints before the modal pops
        const t = window.setTimeout(() => setOpen(true), 300);
        return () => window.clearTimeout(t);
      }
    } catch {
      // localStorage unavailable — skip silently
    }
  }, []);

  function dismiss() {
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
    setOpen(false);
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
        className="w-full max-w-md rounded-t-3xl bg-surface-elevated p-6 shadow-2xl md:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="inline-block rounded-full bg-accent-100 text-amber-800 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide">
              What&apos;s new
            </span>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-ink">
              JoinAdda just got more fun.
            </h2>
            <p className="mt-1.5 text-sm text-ink-secondary">
              Less scrolling. More doing.
            </p>
          </div>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Close"
            className="grid size-8 place-items-center rounded-full text-ink-muted hover:bg-surface-muted"
          >
            <X className="size-5" />
          </button>
        </div>

        <ul className="mt-5 space-y-3">
          <Item
            icon={<Home className="size-4" />}
            title="A new home"
            body="Open the app and there's always something to do or someone to meet — not just stuff to read."
          />
          <Item
            icon={<Sparkles className="size-4" />}
            title="Hangouts"
            body="One tap to ask the city: 'anyone want to grab coffee?' Strangers become friends 30 seconds later."
          />
          <Item
            icon={<Heart className="size-4" />}
            title="A daily match"
            body="One real person a day, picked because you'd actually click. No swiping."
          />
        </ul>

        <div className="mt-6 flex flex-col gap-2">
          <Link
            href="/hangouts/new"
            onClick={dismiss}
            className="inline-flex items-center justify-center gap-2 h-12 rounded-full bg-primary-500 text-white font-semibold text-sm hover:bg-primary-600 transition"
          >
            <Sparkles className="size-4" />
            Plan my first hangout
          </Link>
          <button
            type="button"
            onClick={dismiss}
            className="text-sm font-semibold text-ink-muted hover:text-ink py-2"
          >
            Just take me home
          </button>
        </div>
      </div>
    </div>
  );
}

function Item({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-primary-100 text-primary-700">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-ink">{title}</p>
        <p className="text-sm text-ink-secondary leading-relaxed">{body}</p>
      </div>
    </li>
  );
}
