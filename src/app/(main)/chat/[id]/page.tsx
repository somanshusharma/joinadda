import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/ui/Avatar";
import { ConversationView } from "@/components/chat/ConversationView";
import type { ChatMessage, ChatSender } from "@/components/chat/MessageBubble";

type ConversationRow = {
  id: string;
  type: "dm" | "event_group" | "hangout_group";
  name: string | null;
  event_id: string | null;
};

const GROUP_TINT: Record<string, { bg: string; text: string; icon: string }> = {
  event_group: { bg: "bg-secondary-fixed", text: "text-[#5C4300]", icon: "explore" },
  hangout_group: { bg: "bg-peach", text: "text-primary-700", icon: "groups" },
};

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("conversation_participants")
    .select("profile_id")
    .eq("conversation_id", id)
    .eq("profile_id", user.id)
    .maybeSingle();
  if (!membership) notFound();

  const { data: conv } = await supabase
    .from("conversations")
    .select("id, type, name, event_id")
    .eq("id", id)
    .maybeSingle<ConversationRow>();
  if (!conv) notFound();

  const { data: participants } = await supabase
    .from("conversation_participants")
    .select(
      "profile:profile_id(id, username, display_name, avatar_url)",
    )
    .eq("conversation_id", id);

  type PartRow = { profile: ChatSender | null };
  const senders: Record<string, ChatSender> = {};
  for (const r of ((participants ?? []) as unknown as PartRow[])) {
    if (r.profile) senders[r.profile.id] = r.profile;
  }

  const otherDm =
    conv.type === "dm"
      ? Object.values(senders).find((s) => s.id !== user.id) ?? null
      : null;

  const { data: msgs } = await supabase
    .from("messages")
    .select("id, conversation_id, sender_id, content, created_at")
    .eq("conversation_id", id)
    .eq("is_deleted", false)
    .order("created_at", { ascending: true })
    .limit(200);

  const initialMessages = (msgs as ChatMessage[] | null) ?? [];

  const memberCount = Object.keys(senders).length;
  const title =
    conv.type === "dm"
      ? otherDm?.display_name ?? "Conversation"
      : conv.name ?? "Group";
  const isGroup = conv.type !== "dm";
  const tint = isGroup
    ? GROUP_TINT[conv.type] ?? GROUP_TINT.hangout_group
    : null;

  // Member avatars (up to 2 visible + counter) for the group identity card
  const memberPreviews = Object.values(senders)
    .filter((s) => s.id !== user.id)
    .slice(0, 2);
  const overflow = Math.max(0, memberCount - memberPreviews.length - 1);

  return (
    <div className="-mx-4 md:-mx-6 -mt-4 md:-mt-6 h-[calc(100dvh-7rem)] md:h-[calc(100dvh-6rem)] flex flex-col">
      {/* Header */}
      <header className="px-4 md:px-6 pt-3 pb-3 bg-surface/80 backdrop-blur-xl">
        <div className="flex justify-between items-center mb-3">
          <Link
            href="/chat"
            className="inline-flex items-center gap-1 text-primary-600 font-semibold text-sm active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined text-[20px]">
              chevron_left
            </span>
            chats
          </Link>
          {conv.type === "event_group" && conv.event_id ? (
            <Link
              href={`/trips/${conv.event_id}`}
              className="text-primary-600 font-semibold text-sm hover:underline"
            >
              view event
            </Link>
          ) : null}
          {conv.type === "dm" && otherDm ? (
            <Link
              href={`/profile/${otherDm.username}`}
              className="text-primary-600 font-semibold text-sm hover:underline"
            >
              view profile
            </Link>
          ) : null}
        </div>

        {/* Identity card */}
        <div className="bg-white rounded-2xl sun-kissed-shadow flex items-center p-3 gap-3">
          {isGroup ? (
            <div
              className={`w-12 h-12 ${tint!.bg} ${tint!.text} rounded-full grid place-items-center shrink-0`}
            >
              <span className="material-symbols-outlined">{tint!.icon}</span>
            </div>
          ) : otherDm ? (
            <Link href={`/profile/${otherDm.username}`} className="shrink-0">
              <Avatar
                name={otherDm.display_name}
                src={otherDm.avatar_url}
                seed={otherDm.id}
                size="lg"
              />
            </Link>
          ) : null}

          <div className="min-w-0 flex-1">
            <h1 className="font-display text-lg font-semibold leading-tight text-ink truncate">
              {title}
            </h1>
            <p className="text-xs text-ink-muted truncate">
              {isGroup
                ? `${memberCount} ${memberCount === 1 ? "member" : "members"}`
                : otherDm
                  ? `@${otherDm.username}`
                  : ""}
            </p>
          </div>

          {isGroup && memberPreviews.length > 0 ? (
            <div className="flex -space-x-2 shrink-0">
              {memberPreviews.map((m) => (
                <div
                  key={m.id}
                  className="size-7 rounded-full border-2 border-white overflow-hidden"
                >
                  <Avatar
                    name={m.display_name}
                    src={m.avatar_url}
                    seed={m.id}
                    size="sm"
                  />
                </div>
              ))}
              {overflow > 0 ? (
                <span className="size-7 rounded-full border-2 border-white bg-surface-muted grid place-items-center text-[10px] font-bold text-ink-secondary">
                  +{overflow}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
      </header>

      {/* Messages + composer */}
      <div className="flex-1 min-h-0">
        <ConversationView
          conversationId={id}
          currentUserId={user.id}
          initialMessages={initialMessages}
          senders={senders}
          showSenderNames={isGroup}
        />
      </div>
    </div>
  );
}
