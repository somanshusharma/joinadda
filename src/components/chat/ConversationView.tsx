"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { sendMessage, markRead } from "@/app/actions/chat";
import { Avatar } from "@/components/ui/Avatar";
import type { ChatMessage, ChatSender } from "./MessageBubble";
import { cn, timeAgo } from "@/lib/utils";

type Streak = {
  senderId: string;
  isMine: boolean;
  messages: ChatMessage[];
};

type DayGroup = {
  label: string;
  streaks: Streak[];
};

function buildDayGroups(messages: ChatMessage[], myId: string): DayGroup[] {
  const days: DayGroup[] = [];
  let currentDay: DayGroup | null = null;
  let currentStreak: Streak | null = null;
  const STREAK_GAP_MS = 5 * 60 * 1000;

  for (const m of messages) {
    const date = new Date(m.created_at);
    const dayKey = date.toLocaleDateString(undefined, {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
    if (!currentDay || currentDay.label !== dayKey) {
      currentDay = { label: dayKey, streaks: [] };
      days.push(currentDay);
      currentStreak = null;
    }
    const lastMsg = currentStreak?.messages[currentStreak.messages.length - 1];
    const gap = lastMsg
      ? date.getTime() - new Date(lastMsg.created_at).getTime()
      : Infinity;
    if (
      !currentStreak ||
      currentStreak.senderId !== m.sender_id ||
      gap > STREAK_GAP_MS
    ) {
      currentStreak = {
        senderId: m.sender_id,
        isMine: m.sender_id === myId,
        messages: [m],
      };
      currentDay.streaks.push(currentStreak);
    } else {
      currentStreak.messages.push(m);
    }
  }
  return days;
}

export function ConversationView({
  conversationId,
  currentUserId,
  initialMessages,
  senders,
  showSenderNames,
}: {
  conversationId: string;
  currentUserId: string;
  initialMessages: ChatMessage[];
  senders: Record<string, ChatSender>;
  showSenderNames: boolean;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [pending, startTransition] = useTransition();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages.length]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`conv:${conversationId}:${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const m = payload.new as ChatMessage;
          setMessages((prev) =>
            prev.some((x) => x.id === m.id) ? prev : [...prev, m],
          );
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  useEffect(() => {
    void markRead(conversationId);
  }, [conversationId, messages.length]);

  function submit() {
    const text = draft.trim();
    if (!text || pending) return;
    setDraft("");
    startTransition(async () => {
      const res = await sendMessage(conversationId, text);
      if (!res.ok) setDraft(text);
    });
  }

  const days = buildDayGroups(messages, currentUserId);

  return (
    <div className="relative h-full flex flex-col">
      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto no-scrollbar px-4 md:px-6 pt-4 pb-28 space-y-6"
      >
        {messages.length === 0 ? (
          <p className="py-12 text-center text-sm text-ink-muted">Say hi 👋</p>
        ) : (
          days.map((day) => (
            <div key={day.label} className="space-y-6">
              {/* Date pill */}
              <div className="flex justify-center">
                <span className="px-3 py-1 bg-surface-muted rounded-full text-[12px] text-ink-muted">
                  {day.label}
                </span>
              </div>
              {day.streaks.map((streak, sIdx) => (
                <StreakBubbles
                  key={sIdx}
                  streak={streak}
                  sender={senders[streak.senderId] ?? null}
                  showSenderName={showSenderNames && !streak.isMine}
                />
              ))}
            </div>
          ))
        )}
      </div>

      {/* Composer (sticky-fade) */}
      <footer className="absolute bottom-0 left-0 right-0 px-4 md:px-6 pt-4 pb-4 bg-gradient-to-t from-surface via-surface/90 to-transparent">
        <div className="bg-white rounded-full sun-kissed-shadow p-1.5 flex items-center border border-surface-border focus-within:border-primary-400 transition-colors">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="type a message…"
            className="flex-1 bg-transparent border-none focus:ring-0 px-4 py-2 text-base text-ink placeholder:text-ink-light outline-none"
          />
          <button
            type="button"
            onClick={submit}
            disabled={pending || !draft.trim()}
            aria-label="Send"
            className="w-10 h-10 bg-primary-500 text-white rounded-full grid place-items-center active:scale-90 transition-transform shadow-lg shadow-primary-500/20 disabled:opacity-50 hover:bg-primary-600"
          >
            <span className="material-symbols-outlined">send</span>
          </button>
        </div>
      </footer>
    </div>
  );
}

function StreakBubbles({
  streak,
  sender,
  showSenderName,
}: {
  streak: Streak;
  sender: ChatSender | null;
  showSenderName: boolean;
}) {
  const { isMine, messages } = streak;
  const lastMsg = messages[messages.length - 1];

  return (
    <div
      className={cn(
        "flex flex-col gap-1 max-w-[85%]",
        isMine ? "items-end ml-auto" : "items-start",
      )}
    >
      {showSenderName && sender ? (
        <Link
          href={`/profile/${sender.username}`}
          className="ml-12 text-[13px] font-semibold text-primary-700 hover:underline"
        >
          {sender.display_name}
        </Link>
      ) : null}

      {messages.map((m, i) => {
        const isFirst = i === 0;
        const showAvatar = !isMine && isFirst && sender;
        return (
          <div
            key={m.id}
            className={cn(
              "flex items-end gap-3",
              isMine ? "flex-row-reverse" : "",
            )}
          >
            {/* Avatar slot — only on the first message of the streak (others' side) */}
            {!isMine ? (
              <div className="w-8 shrink-0">
                {showAvatar ? (
                  <Avatar
                    name={sender.display_name}
                    src={sender.avatar_url}
                    seed={sender.id}
                    size="sm"
                    className="shadow-sm"
                  />
                ) : null}
              </div>
            ) : null}

            <div
              className={cn(
                "px-4 py-3 text-base leading-relaxed sun-kissed-shadow rounded-2xl",
                isMine
                  ? "bg-primary-500 text-white"
                  : "bg-surface-muted text-ink",
                // Sharpen the corner facing the sender, only on the LAST message of the streak
                i === messages.length - 1 &&
                  (isMine ? "rounded-br-md" : "rounded-bl-md"),
              )}
            >
              <p className="whitespace-pre-wrap break-words">{m.content}</p>
            </div>
          </div>
        );
      })}

      {/* Footer label per streak */}
      <span
        className={cn(
          "text-[11px] text-ink-light mt-0.5",
          isMine ? "mr-1" : "ml-12",
        )}
      >
        {isMine ? "You" : sender?.display_name.split(" ")[0] ?? "Them"} ·{" "}
        {timeAgo(lastMsg.created_at)}
      </span>
    </div>
  );
}
