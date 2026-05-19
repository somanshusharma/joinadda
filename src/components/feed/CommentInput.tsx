"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { createComment } from "@/app/actions/post";

export function CommentInput({ postId }: { postId: string }) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [pending, startTransition] = useTransition();

  function submit() {
    if (!value.trim() || pending) return;
    const text = value;
    setValue("");
    startTransition(async () => {
      const res = await createComment({ postId, content: text });
      if (!res.ok) setValue(text);
      else router.refresh();
    });
  }

  return (
    <div className="sticky bottom-20 z-30 flex items-center gap-2 rounded-full border border-surface-border bg-surface-elevated p-1.5 shadow-sm md:bottom-4">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
        placeholder="Drop a comment…"
        className="h-10 flex-1 bg-transparent px-3 text-sm text-ink placeholder:text-ink-muted focus:outline-none"
      />
      <button
        type="button"
        onClick={submit}
        disabled={pending || !value.trim()}
        aria-label="Send"
        className="grid size-9 place-items-center rounded-full bg-primary-500 text-white transition disabled:opacity-50 hover:bg-primary-600"
      >
        <Send className="size-4" />
      </button>
    </div>
  );
}
