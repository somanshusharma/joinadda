"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { signOut } from "@/app/actions/auth";
import type { ShellUser } from "./AppShell";

const PUBLIC_ITEMS = [
  { href: "/", label: "home", icon: "home" },
  { href: "/trips", label: "trips", icon: "explore" },
  { href: "/hangouts", label: "hangouts", icon: "groups" },
  { href: "/communities", label: "addas", icon: "diversity_3" },
] as const;

const AUTHED_ITEMS = [
  { href: "/feed", label: "the feed", icon: "forum" },
  { href: "/chat", label: "DMs", icon: "chat_bubble" },
  { href: "/match", label: "daily match", icon: "favorite" },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function SideNav({ user }: { user: ShellUser }) {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col gap-1 w-64 sticky top-20 self-start h-[calc(100vh-5rem)] py-6 pr-4">
      {user && user.streakCount > 0 ? (
        <div className="mb-3 mx-4 inline-flex items-center gap-2 self-start bg-mango-400/40 text-mango-700 px-3 py-1.5 rounded-full">
          <span className="text-base leading-none">🔥</span>
          <span className="text-xs font-bold">
            {user.streakCount}-day streak
          </span>
        </div>
      ) : null}
      <nav className="flex flex-col gap-1">
        {PUBLIC_ITEMS.map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.label}
            active={isActive(pathname, item.href)}
          />
        ))}

        {user ? (
          <>
            <div className="h-px bg-surface-border my-4 mx-4" />
            {AUTHED_ITEMS.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                icon={item.icon}
                label={item.label}
                active={isActive(pathname, item.href)}
              />
            ))}
            <NavLink
              href={`/profile/${user.username}`}
              icon="person"
              label="you"
              active={pathname.startsWith("/profile")}
            />
          </>
        ) : null}
      </nav>

      <div className="mt-auto">
        {user ? (
          <form action={signOut}>
            <button
              type="submit"
              className="w-full flex items-center gap-3 px-4 py-3 rounded-full text-ink-muted hover:bg-surface-muted hover:text-danger transition-all"
            >
              <span className="material-symbols-outlined">logout</span>
              <span className="text-sm">sign out</span>
            </button>
          </form>
        ) : (
          <div className="px-4 py-6 bg-lilac/30 rounded-3xl border border-lilac/50">
            <span className="font-sticker text-lg text-primary-600 block mb-1 leading-none">
              psst:
            </span>
            <p className="text-sm text-ink-secondary leading-snug mb-3">
              Want to RSVP, DM people, or plan a hangout?
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center w-full bg-primary-500 text-white font-bold rounded-full px-4 py-2 text-sm hover:bg-primary-600 transition"
            >
              Join the adda
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}

function NavLink({
  href,
  icon,
  label,
  active,
}: {
  href: string;
  icon: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      prefetch
      className={cn(
        "rounded-full px-4 py-3 flex items-center gap-3 transition-all",
        active
          ? "bg-mango-400 text-mango-700 font-semibold"
          : "text-ink-secondary hover:bg-surface-muted",
      )}
    >
      <span
        className="material-symbols-outlined"
        style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
      >
        {icon}
      </span>
      <span className="text-sm">{label}</span>
    </Link>
  );
}
