"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export function NotificationBell({
  userId,
  initialUnread,
  className,
}: {
  userId: string;
  initialUnread: number;
  className?: string;
}) {
  const [unread, setUnread] = useState(initialUnread);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`notif:${userId}:${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `recipient_id=eq.${userId}`,
        },
        () => setUnread((u) => u + 1),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return (
    <Link
      href="/notifications"
      onClick={() => setUnread(0)}
      aria-label={unread > 0 ? `${unread} unread notifications` : "Notifications"}
      className={cn(
        "relative grid place-items-center size-10 rounded-full hover:bg-surface-muted text-ink",
        className,
      )}
    >
      <Bell className="size-5" />
      {unread > 0 ? (
        <span className="absolute -top-0.5 -right-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-primary-500 px-1 text-[10px] font-bold text-white">
          {unread > 9 ? "9+" : unread}
        </span>
      ) : null}
    </Link>
  );
}
