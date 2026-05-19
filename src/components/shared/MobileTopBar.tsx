import Link from "next/link";
import { NotificationBell } from "./NotificationBell";
import type { ShellUser } from "./AppShell";

export function MobileTopBar({ user }: { user: ShellUser }) {
  return (
    <header className="md:hidden sticky top-0 z-30 flex items-center justify-between gap-3 bg-surface/80 px-5 py-4 backdrop-blur-xl">
      <Link
        href="/"
        className="font-serif text-2xl font-semibold text-primary-600 tracking-tight"
      >
        joinadda
      </Link>
      {user ? (
        <NotificationBell
          userId={user.userId}
          initialUnread={user.unreadNotifications}
        />
      ) : (
        <Link
          href="/signup"
          className="text-sm font-semibold bg-primary-500 text-white px-4 h-9 inline-flex items-center rounded-full"
        >
          Join
        </Link>
      )}
    </header>
  );
}
