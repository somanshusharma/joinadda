"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, ImagePlus } from "lucide-react";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { createPost } from "@/app/actions/post";
import { cn } from "@/lib/utils";

type Tab = "post" | "poll";

export function PostComposer({
  communities,
}: {
  communities: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("post");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [showImageInput, setShowImageInput] = useState(false);
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
  const [communityId, setCommunityId] = useState<string>("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function reset() {
    setContent("");
    setImageUrl("");
    setShowImageInput(false);
    setPollOptions(["", ""]);
    setIsAnonymous(false);
    setError(null);
    setTab("post");
  }

  function close() {
    setOpen(false);
    reset();
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await createPost({
        content,
        type: tab === "poll" ? "poll" : imageUrl ? "image" : "text",
        image_url: tab === "post" && imageUrl ? imageUrl : null,
        community_id: communityId || null,
        poll_options: tab === "poll" ? pollOptions : null,
        is_anonymous: isAnonymous,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      close();
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="New post"
        className="fixed bottom-20 right-4 z-40 grid size-14 place-items-center rounded-full bg-primary-500 text-white shadow-lg hover:bg-primary-600 md:bottom-8 md:right-8"
      >
        <Plus className="size-6" />
      </button>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 md:items-center md:p-4"
          onClick={close}
        >
          <div
            className="w-full max-w-xl rounded-t-3xl bg-surface-elevated p-5 shadow-lg md:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-extrabold tracking-tight">
                Drop something
              </h2>
              <button
                type="button"
                onClick={close}
                aria-label="Close"
                className="grid size-8 place-items-center rounded-full text-ink-muted hover:bg-surface-muted"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="mt-3 flex gap-1 border-b border-surface-border">
              {[
                { key: "post", label: "Post" },
                { key: "poll", label: "Poll" },
              ].map((t) => {
                const isActive = t.key === tab;
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setTab(t.key as Tab)}
                    className={cn(
                      "px-4 py-2 text-sm font-semibold transition border-b-2 -mb-px",
                      isActive
                        ? "border-primary-500 text-primary-700"
                        : "border-transparent text-ink-muted hover:text-ink",
                    )}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 space-y-3">
              <Textarea
                autoFocus
                placeholder={
                  tab === "poll"
                    ? "Ask the crew something…"
                    : "What's up? Share a thought, a meme, a Tuesday rant."
                }
                value={content}
                onChange={(e) => setContent(e.target.value)}
                maxLength={2000}
                className="min-h-32"
              />

              {tab === "post" ? (
                <>
                  {showImageInput ? (
                    <Input
                      placeholder="Paste image URL"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowImageInput(true)}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:underline"
                    >
                      <ImagePlus className="size-4" /> Attach an image
                    </button>
                  )}
                </>
              ) : (
                <div className="space-y-2">
                  {pollOptions.map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Input
                        placeholder={`Option ${i + 1}`}
                        value={opt}
                        onChange={(e) => {
                          const next = [...pollOptions];
                          next[i] = e.target.value;
                          setPollOptions(next);
                        }}
                      />
                      {pollOptions.length > 2 ? (
                        <button
                          type="button"
                          onClick={() =>
                            setPollOptions((arr) => arr.filter((_, j) => j !== i))
                          }
                          aria-label="Remove option"
                          className="grid size-9 place-items-center rounded-full text-ink-muted hover:bg-surface-muted"
                        >
                          <X className="size-4" />
                        </button>
                      ) : null}
                    </div>
                  ))}
                  {pollOptions.length < 6 ? (
                    <button
                      type="button"
                      onClick={() => setPollOptions((arr) => [...arr, ""])}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:underline"
                    >
                      <Plus className="size-4" /> Add option
                    </button>
                  ) : null}
                </div>
              )}

              {communities.length > 0 ? (
                <select
                  value={communityId}
                  onChange={(e) => setCommunityId(e.target.value)}
                  className="h-11 w-full rounded-2xl border border-surface-border bg-surface-elevated px-4 text-sm text-ink focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
                >
                  <option value="">Post to your feed</option>
                  {communities.map((c) => (
                    <option key={c.id} value={c.id}>
                      Post to {c.name}
                    </option>
                  ))}
                </select>
              ) : null}

              <label className="flex items-start gap-2.5 rounded-2xl border border-surface-border bg-surface-muted/60 p-3 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="mt-0.5 size-4 accent-[var(--color-primary-500)]"
                />
                <span className="flex-1">
                  <span className="font-semibold text-ink">Post anonymously</span>
                  <span className="block text-xs text-ink-muted">
                    Your handle stays hidden. Moderators can still see your account.
                  </span>
                </span>
              </label>

              {error ? <p className="text-sm text-danger">{error}</p> : null}
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <Button variant="ghost" onClick={close}>
                Cancel
              </Button>
              <Button onClick={submit} loading={pending}>
                Post
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
