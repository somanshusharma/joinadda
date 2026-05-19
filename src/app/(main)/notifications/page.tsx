import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { timeAgo, cn } from "@/lib/utils";
import { markAllNotificationsRead } from "@/app/actions/notifications";

type NotifType =
  | "follow"
  | "post_reaction"
  | "comment"
  | "comment_reply"
  | "event_rsvp"
  | "event_reminder"
  | "mention"
  | "dm"
  | "hangout_join"
  | "hangout_starting"
  | "daily_match";

type NotificationRow = {
  id: string;
  type: NotifType;
  entity_type: string | null;
  entity_id: string | null;
  is_read: boolean;
  created_at: string;
  actor: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
  } | null;
};

const VERBS: Record<NotifType, string> = {
  follow: "started following you",
  post_reaction: "reacted to your post",
  comment: "commented on your post",
  comment_reply: "replied to your comment",
  event_rsvp: "is going to your event",
  event_reminder: "your event is coming up",
  mention: "mentioned you",
  dm: "sent you a message",
  hangout_join: "joined your hangout",
  hangout_starting: "your hangout is starting soon",
  daily_match: "you have a new match today",
};

const SYSTEM_TYPES = new Set<NotifType>([
  "event_reminder",
  "hangout_starting",
  "daily_match",
]);

const AVATAR_TINTS = ["bg-peach", "bg-lilac", "bg-sky", "bg-tertiary-fixed"];
function tintFor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return AVATAR_TINTS[h % AVATAR_TINTS.length];
}

function hrefFor(n: NotificationRow): string {
  switch (n.type) {
    case "follow":
      return n.actor ? `/profile/${n.actor.username}` : "/notifications";
    case "post_reaction":
    case "comment":
    case "comment_reply":
    case "mention":
      return n.entity_id ? `/feed/post/${n.entity_id}` : "/notifications";
    case "event_rsvp":
    case "event_reminder":
      return n.entity_id ? `/trips/${n.entity_id}` : "/notifications";
    case "hangout_join":
    case "hangout_starting":
      return n.entity_id ? `/hangouts/${n.entity_id}` : "/hangouts";
    case "dm":
      return n.entity_id ? `/chat/${n.entity_id}` : "/chat";
    case "daily_match":
      return "/match";
  }
}

export default async function NotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("notifications")
    .select(
      "id, type, entity_type, entity_id, is_read, created_at, actor:actor_id(id, username, display_name, avatar_url)",
    )
    .eq("recipient_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  const notifs = (data as unknown as NotificationRow[]) ?? [];
  const hasUnread = notifs.some((n) => !n.is_read);

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <section className="flex justify-between items-end mb-8 gap-3">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl font-semibold tracking-tight text-ink leading-tight">
            Notifications
          </h1>
          <p className="mt-1 text-base text-ink-secondary">
            Catch up on the action.
          </p>
        </div>
        {hasUnread ? (
          <form
            action={async () => {
              "use server";
              await markAllNotificationsRead();
            }}
          >
            <button
              type="submit"
              className="px-4 h-10 rounded-full border border-surface-border text-sm font-semibold text-ink-secondary hover:bg-surface-muted active:scale-95 transition-all whitespace-nowrap"
            >
              mark all read
            </button>
          </form>
        ) : null}
      </section>

      {/* List */}
      {notifs.length === 0 ? (
        <EmptyState
          icon={<span className="material-symbols-outlined text-4xl">bell</span>}
          title="All quiet here."
          description="When people follow, react, or DM you, it'll show up here."
        />
      ) : (
        <div className="space-y-1">
          {notifs.map((n) => (
            <NotifRow key={n.id} notif={n} />
          ))}
        </div>
      )}

      {/* All caught up sticker */}
      {notifs.length > 0 && !hasUnread ? (
        <div className="mt-12 flex justify-center">
          <div className="-rotate-2 bg-peach/40 px-4 py-2 rounded-lg border border-primary-200/30">
            <p className="font-sticker text-lg text-primary-700">
              all caught up! ✨
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function NotifRow({ notif }: { notif: NotificationRow }) {
  const isSystem = SYSTEM_TYPES.has(notif.type);
  const tint = notif.actor ? tintFor(notif.actor.id) : "bg-primary-500";
  const actorName = notif.actor?.display_name ?? "Someone";

  return (
    <Link
      href={hrefFor(notif)}
      className={cn(
        "flex items-center p-4 rounded-2xl transition-all active:scale-[0.98] group",
        !notif.is_read
          ? "bg-primary-100/40 hover:bg-primary-100/60"
          : "hover:bg-surface-muted",
        isSystem ? "border border-dashed border-surface-border" : "",
      )}
    >
      <div
        className={cn(
          "size-10 rounded-full overflow-hidden shrink-0",
          isSystem
            ? "bg-primary-500 grid place-items-center text-white"
            : tint,
        )}
      >
        {isSystem ? (
          <span
            className="material-symbols-outlined"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            {notif.type === "daily_match" ? "favorite" : "notifications"}
          </span>
        ) : notif.actor ? (
          <Avatar
            name={notif.actor.display_name}
            src={notif.actor.avatar_url}
            seed={notif.actor.id}
            size="md"
          />
        ) : (
          <span className="material-symbols-outlined">notifications</span>
        )}
      </div>

      <div className="ml-4 flex-1 min-w-0 pr-3">
        <p className="text-base text-ink leading-snug">
          <span className="font-bold">
            {isSystem ? "Adda" : actorName}
          </span>{" "}
          <span className="text-ink-secondary">{VERBS[notif.type]}</span>
        </p>
        <p className="text-xs text-ink-muted/80 mt-0.5">
          {timeAgo(notif.created_at)}
        </p>
      </div>

      {!notif.is_read ? (
        <span className="size-2 shrink-0 rounded-full bg-primary-500" />
      ) : isSystem ? (
        <span className="material-symbols-outlined text-mango-500 text-[18px] opacity-70">
          auto_awesome
        </span>
      ) : null}
    </Link>
  );
}
