"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { signOut } from "@/app/actions/auth";

type Props = {
  user: {
    userId: string;
    displayName: string;
    username: string;
    avatarUrl: string | null;
  };
};

export function ProfileMenu({ user }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Account menu"
        aria-haspopup="menu"
        aria-expanded={open}
        className="rounded-full ring-offset-2 hover:ring-2 ring-primary-200 transition-all"
      >
        <Avatar
          name={user.displayName}
          src={user.avatarUrl}
          seed={user.userId}
          size="md"
        />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-surface-border sun-kissed-shadow overflow-hidden z-50"
        >
          <Link
            href={`/profile/${user.username}`}
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-3 hover:bg-surface-muted transition-colors"
          >
            <Avatar
              name={user.displayName}
              src={user.avatarUrl}
              seed={user.userId}
              size="sm"
            />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink truncate">
                {user.displayName}
              </p>
              <p className="text-xs text-ink-muted truncate">
                @{user.username}
              </p>
            </div>
          </Link>

          <div className="h-px bg-surface-border" />

          <Link
            href="/profile/edit"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-ink-secondary hover:bg-surface-muted transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">edit</span>
            edit profile
          </Link>
          <Link
            href="/notifications"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-ink-secondary hover:bg-surface-muted transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">
              notifications
            </span>
            notifications
          </Link>

          <div className="h-px bg-surface-border" />

          <form action={signOut}>
            <button
              type="submit"
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-danger hover:bg-danger/5 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">
                logout
              </span>
              Sign out
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
