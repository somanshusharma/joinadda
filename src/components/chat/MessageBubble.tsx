import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";

export type ChatMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

export type ChatSender = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
};

export function MessageBubble({
  message,
  sender,
  isMine,
  showAvatar,
  showName,
}: {
  message: ChatMessage;
  sender: ChatSender | null;
  isMine: boolean;
  showAvatar: boolean;
  showName: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-end gap-2",
        isMine ? "flex-row-reverse" : "flex-row",
      )}
    >
      <div className="w-8 shrink-0">
        {!isMine && showAvatar && sender ? (
          <Link href={`/profile/${sender.username}`}>
            <Avatar
              name={sender.display_name}
              src={sender.avatar_url}
              seed={sender.id}
              size="sm"
            />
          </Link>
        ) : null}
      </div>
      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
          isMine
            ? "rounded-br-sm bg-primary-500 text-white"
            : "rounded-bl-sm bg-surface-muted text-ink",
        )}
      >
        {!isMine && showName && sender ? (
          <p className="mb-0.5 text-[11px] font-semibold text-primary-700">
            {sender.display_name}
          </p>
        ) : null}
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
      </div>
    </div>
  );
}
