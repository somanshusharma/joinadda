import Link from "next/link";
import { redirect } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { timeAgo } from "@/lib/utils";
import { cn } from "@/lib/utils";

type Tab = "dms" | "groups";

type ConvParticipantRow = {
  conversation_id: string;
  last_read_at: string;
  conversation: {
    id: string;
    type: "dm" | "event_group" | "hangout_group";
    name: string | null;
    event_id: string | null;
    last_message_at: string;
  } | null;
};

type OtherParticipantRow = {
  conversation_id: string;
  profile: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
  } | null;
};

type MessageRow = {
  conversation_id: string;
  content: string;
  created_at: string;
  sender: { id: string; display_name: string } | null;
};

const GROUP_ICON_TINTS: Record<string, { bg: string; text: string; icon: string }> = {
  event_group: { bg: "bg-secondary-fixed", text: "text-[#5C4300]", icon: "explore" },
  hangout_group: { bg: "bg-primary-fixed", text: "text-primary-700", icon: "groups" },
};

export default async function ChatListPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab: rawTab } = await searchParams;
  const tab: Tab = rawTab === "groups" ? "groups" : "dms";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: rows } = await supabase
    .from("conversation_participants")
    .select(
      "conversation_id, last_read_at, conversation:conversation_id(id, type, name, event_id, last_message_at)",
    )
    .eq("profile_id", user.id);

  const allConvs = ((rows ?? []) as unknown as ConvParticipantRow[]).filter(
    (r): r is ConvParticipantRow & {
      conversation: NonNullable<ConvParticipantRow["conversation"]>;
    } => r.conversation !== null,
  );

  const convs = allConvs
    .filter((r) =>
      tab === "groups"
        ? r.conversation.type !== "dm"
        : r.conversation.type === "dm",
    )
    .sort(
      (a, b) =>
        new Date(b.conversation.last_message_at).getTime() -
        new Date(a.conversation.last_message_at).getTime(),
    );

  const ids = convs.map((c) => c.conversation_id);

  let othersByConv = new Map<string, OtherParticipantRow["profile"]>();
  if (tab === "dms" && ids.length > 0) {
    const { data: others } = await supabase
      .from("conversation_participants")
      .select(
        "conversation_id, profile:profile_id(id, username, display_name, avatar_url)",
      )
      .in("conversation_id", ids)
      .neq("profile_id", user.id);
    othersByConv = new Map(
      ((others ?? []) as unknown as OtherParticipantRow[]).map((r) => [
        r.conversation_id,
        r.profile,
      ]),
    );
  }

  const lastByConv = new Map<string, MessageRow>();
  if (ids.length > 0) {
    const { data: msgs } = await supabase
      .from("messages")
      .select(
        "conversation_id, content, created_at, sender:sender_id(id, display_name)",
      )
      .in("conversation_id", ids)
      .order("created_at", { ascending: false })
      .limit(ids.length * 3);
    for (const m of ((msgs ?? []) as unknown as MessageRow[])) {
      if (!lastByConv.has(m.conversation_id)) lastByConv.set(m.conversation_id, m);
    }
  }

  // Counts for both tabs (so we could surface totals if we want later)
  const dmCount = allConvs.filter((c) => c.conversation.type === "dm").length;
  const groupCount = allConvs.filter((c) => c.conversation.type !== "dm").length;

  return (
    <div className="max-w-2xl pb-12">
      {/* Header */}
      <section className="mb-8">
        <h1 className="font-serif text-3xl md:text-4xl font-semibold tracking-tight text-ink leading-tight lowercase">
          chats
        </h1>
        <p className="mt-1 text-base text-ink-secondary">
          DMs and your event group chats.
        </p>
      </section>

      {/* Tabs (label + small bar indicator) */}
      <nav className="flex gap-8 mb-8 border-b border-surface-border pb-px">
        <TabLink href="/chat?tab=dms" label="DMs" count={dmCount} active={tab === "dms"} />
        <TabLink
          href="/chat?tab=groups"
          label="Group chats"
          count={groupCount}
          active={tab === "groups"}
        />
      </nav>

      {convs.length === 0 ? (
        <EmptyState
          icon={<MessageCircle />}
          title={tab === "dms" ? "Your DMs are empty." : "No group chats yet."}
          description={
            tab === "dms"
              ? "Say hi to someone from a recent hangout."
              : "RSVP to an event or join a hangout — you'll land in its group chat automatically."
          }
        />
      ) : (
        <div className="space-y-2">
          {convs.map((row) => {
            const conv = row.conversation;
            const last = lastByConv.get(conv.id);
            const unread =
              !!last &&
              new Date(last.created_at).getTime() >
                new Date(row.last_read_at).getTime();
            const isDm = conv.type === "dm";
            const other = isDm ? othersByConv.get(conv.id) ?? null : null;
            const title = isDm
              ? other?.display_name ?? "Unknown"
              : conv.name ?? "Group";

            return (
              <Link
                key={conv.id}
                href={`/chat/${conv.id}`}
                className={cn(
                  "flex items-center p-4 rounded-2xl transition-all duration-200 active:scale-[0.98]",
                  unread
                    ? "bg-white sun-kissed-shadow"
                    : "hover:bg-white hover:sun-kissed-shadow",
                )}
              >
                {/* Avatar / icon */}
                <div className="relative shrink-0">
                  {isDm && other ? (
                    <div className="rounded-full border-2 border-white shadow-sm">
                      <Avatar
                        name={other.display_name}
                        src={other.avatar_url}
                        seed={other.id}
                        size="md"
                      />
                    </div>
                  ) : (
                    <GroupIcon type={conv.type} />
                  )}
                </div>

                {/* Content */}
                <div className="ml-4 flex-1 min-w-0">
                  <div className="flex justify-between items-center gap-2">
                    <span className="font-display text-base font-semibold text-ink truncate">
                      {title}
                    </span>
                    {last ? (
                      <span className="shrink-0 text-xs text-ink-muted">
                        {timeAgo(last.created_at)}
                      </span>
                    ) : null}
                  </div>
                  <div className="flex justify-between items-center mt-0.5 gap-2">
                    <p className="text-sm text-ink-muted truncate min-w-0">
                      {last ? (
                        !isDm && last.sender ? (
                          <>
                            <span
                              className={cn(
                                "font-semibold",
                                conv.type === "event_group"
                                  ? "text-[#5C4300]"
                                  : "text-primary-700",
                              )}
                            >
                              {last.sender.display_name.split(" ")[0]}:
                            </span>{" "}
                            {last.content}
                          </>
                        ) : (
                          last.content
                        )
                      ) : (
                        "No messages yet"
                      )}
                    </p>
                    {unread ? (
                      <span className="size-2 shrink-0 rounded-full bg-primary-500" />
                    ) : null}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Handwritten sticker */}
      <div className="mt-12 flex justify-center opacity-50 select-none pointer-events-none">
        <span className="font-sticker text-lg text-primary-600 -rotate-2">
          keep it slow &amp; gentle
        </span>
      </div>
    </div>
  );
}

function TabLink({
  href,
  label,
  count,
  active,
}: {
  href: string;
  label: string;
  count: number;
  active: boolean;
}) {
  return (
    <Link href={href} prefetch className="flex flex-col items-center group">
      <span
        className={cn(
          "text-sm font-semibold transition-colors flex items-baseline gap-1.5",
          active
            ? "text-primary-700"
            : "text-ink-muted group-hover:text-primary-600",
        )}
      >
        {label}
        {count > 0 ? (
          <span className="text-[11px] font-bold text-ink-muted">
            ({count})
          </span>
        ) : null}
      </span>
      <span
        className={cn(
          "mt-1 h-[3px] w-6 rounded-full bg-primary-500 transition-opacity",
          active ? "opacity-100" : "opacity-0",
        )}
      />
    </Link>
  );
}

function GroupIcon({ type }: { type: string }) {
  const tint =
    GROUP_ICON_TINTS[type] ?? {
      bg: "bg-primary-fixed",
      text: "text-primary-700",
      icon: "groups",
    };
  return (
    <div
      className={`w-10 h-10 rounded-full ${tint.bg} ${tint.text} grid place-items-center shadow-sm`}
    >
      <span className="material-symbols-outlined">{tint.icon}</span>
    </div>
  );
}
