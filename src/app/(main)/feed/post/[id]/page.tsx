import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/ui/Avatar";
import { PostCard } from "@/components/feed/PostCard";
import { CommentInput } from "@/components/feed/CommentInput";
import { POST_COLUMNS, hydratePosts, type RawPost } from "@/lib/feed";
import { timeAgo } from "@/lib/utils";

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: postRow } = await supabase
    .from("posts")
    .select(POST_COLUMNS)
    .eq("id", id)
    .eq("is_deleted", false)
    .maybeSingle();

  if (!postRow) notFound();

  const [hydrated] = await hydratePosts(
    supabase,
    [postRow as unknown as RawPost],
    user?.id ?? null,
  );

  const { data: commentsData } = await supabase
    .from("comments")
    .select(
      "id, content, created_at, author:author_id(id, username, display_name, avatar_url)",
    )
    .eq("post_id", id)
    .eq("is_deleted", false)
    .order("created_at", { ascending: true })
    .limit(200);

  type CommentRow = {
    id: string;
    content: string;
    created_at: string;
    author: {
      id: string;
      username: string;
      display_name: string;
      avatar_url: string | null;
    } | null;
  };
  const comments = ((commentsData as unknown as CommentRow[]) ?? []).filter(
    (c): c is CommentRow & { author: NonNullable<CommentRow["author"]> } =>
      c.author !== null,
  );

  return (
    <div className="pb-4">
      <Link
        href="/feed"
        className="mb-3 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink"
      >
        <ChevronLeft className="size-4" /> Back
      </Link>

      <PostCard post={hydrated} />

      <h2 className="mt-6 mb-3 text-sm font-semibold text-ink-secondary">
        {comments.length} {comments.length === 1 ? "comment" : "comments"}
      </h2>

      <div className="space-y-3">
        {comments.map((c) => (
          <div
            key={c.id}
            className="flex items-start gap-3 rounded-2xl border border-surface-border bg-surface-elevated p-4"
          >
            <Link href={`/profile/${c.author.username}`}>
              <Avatar
                name={c.author.display_name}
                src={c.author.avatar_url}
                seed={c.author.id}
                size="sm"
              />
            </Link>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <Link
                  href={`/profile/${c.author.username}`}
                  className="truncate text-sm font-semibold hover:underline"
                >
                  {c.author.display_name}
                </Link>
                <span className="text-xs text-ink-muted">
                  {timeAgo(c.created_at)}
                </span>
              </div>
              <p className="mt-0.5 whitespace-pre-wrap text-sm leading-relaxed text-ink">
                {c.content}
              </p>
            </div>
          </div>
        ))}
      </div>

      {user ? (
        <div className="mt-4">
          <CommentInput postId={id} />
        </div>
      ) : null}
    </div>
  );
}
