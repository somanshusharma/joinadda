import Link from "next/link";
import { NotificationBell } from "./NotificationBell";
import { ProfileMenu } from "./ProfileMenu";
import type { ShellUser } from "./AppShell";

export function TopBar({ user }: { user: ShellUser }) {
  return (
    <header className="hidden md:block sticky top-0 z-30 bg-surface/80 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl flex items-center justify-between gap-6 px-6 h-20">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="material-symbols-outlined text-primary-500 text-3xl group-hover:rotate-6 transition-transform">
            bubble_chart
          </span>
          <span className="font-serif text-2xl font-semibold text-primary-600 tracking-tight">
            joinadda
          </span>
        </Link>

        <div className="flex-1 max-w-md">
          <label className="flex items-center bg-surface-low rounded-full px-4 h-11 border border-surface-border">
            <span className="material-symbols-outlined text-ink-muted mr-2 text-[20px]">
              search
            </span>
            <input
              type="search"
              placeholder="find your people…"
              className="bg-transparent border-none focus:ring-0 text-sm w-full placeholder:text-ink-light outline-none"
            />
          </label>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <NotificationBell
                userId={user.userId}
                initialUnread={user.unreadNotifications}
              />
              <ProfileMenu user={user} />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-semibold text-ink-secondary hover:text-ink px-3 py-2"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="text-sm font-semibold bg-primary-500 text-white hover:bg-primary-600 px-5 h-10 inline-flex items-center rounded-full transition"
              >
                Join the adda
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
