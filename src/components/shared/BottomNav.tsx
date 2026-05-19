"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/", label: "home", icon: "home" },
  { href: "/trips", label: "trips", icon: "explore" },
  { href: "/hangouts", label: "hangouts", icon: "groups" },
  { href: "/chat", label: "chat", icon: "chat_bubble" },
  { href: "/profile", label: "you", icon: "person" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 flex justify-around items-center px-2 py-2 bg-surface md:hidden shadow-[0_-4px_24px_-4px_rgba(168,57,0,0.06)]"
      aria-label="Primary"
    >
      {TABS.map(({ href, label, icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            prefetch
            className={cn(
              "flex flex-col items-center justify-center transition-all",
              active
                ? "bg-mango-400 text-mango-700 rounded-full px-4 py-1.5"
                : "text-ink-muted px-3 py-1.5 hover:text-primary-600",
            )}
          >
            <span
              className="material-symbols-outlined text-[22px] leading-none"
              style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              {icon}
            </span>
            <span className="text-[11px] font-medium mt-0.5">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
