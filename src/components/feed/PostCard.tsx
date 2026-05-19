import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { ReactionBar } from "./ReactionBar";
import { PollBlock, type PollOption } from "./PollBlock";
import { ReportButton } from "@/components/shared/ReportButton";
import { REACTION_TYPES } from "@/lib/config";
import { timeAgo } from "@/lib/utils";

export type FeedPost = {
  id: string;
  content: string;
  type: "text" | "image" | "poll" | "question";
  image_url: string | null;
  poll_options: PollOption[] | null;
  comment_count: number;
  created_at: string;
  is_anonymous?: boolean;
  anonymous_handle?: string | null;
  author: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
    profession: string | null;
  };
  community: { slug: string; name: string } | null;
  reaction_counts: Record<string, number>;
  my_reactions: string[];
  poll_vote_counts?: Record<number, number>;
  my_poll_vote?: number | null;
};

export function PostCard({ post }: { post: FeedPost }) {
  const allowed = new Set(REACTION_TYPES as readonly string[]);
  const mine = post.my_reactions.filter((r): r is (typeof REACTION_TYPES)[number] =>
    allowed.has(r),
  );

  return (
    <article className="rounded-3xl border border-surface-border bg-surface-elevated p-6 soft-shadow">
      <header className="flex items-center gap-3">
        {post.is_anonymous ? (
          <Avatar
            name={post.anonymous_handle ?? "Anonymous"}
            seed={post.anonymous_handle ?? post.id}
            size="md"
          />
        ) : (
          <Link href={`/profile/${post.author.username}`}>
            <Avatar
              name={post.author.display_name}
              src={post.author.avatar_url}
              seed={post.author.id}
              size="md"
            />
          </Link>
        )}
        <div className="min-w-0 flex-1">
          {post.is_anonymous ? (
            <span className="block truncate text-[18px] font-semibold leading-tight text-ink">
              {post.anonymous_handle ?? "Anonymous"}
            </span>
          ) : (
            <Link
              href={`/profile/${post.author.username}`}
              className="block truncate text-[18px] font-semibold leading-tight text-ink hover:underline"
            >
              {post.author.display_name}
            </Link>
          )}
          <p className="truncate text-xs text-ink-muted">
            {post.is_anonymous ? "Anonymous" : `@${post.author.username}`}
            {post.community ? (
              <>
                {" · in "}
                <Link
                  href={`/communities/${post.community.slug}`}
                  className="hover:underline"
                >
                  {post.community.name}
                </Link>
              </>
            ) : null}
            {" · "}
            {timeAgo(post.created_at)}
          </p>
        </div>
      </header>

      <Link href={`/feed/post/${post.id}`} className="mt-4 block">
        <p className="whitespace-pre-wrap text-base leading-relaxed text-ink">
          {post.content}
        </p>
      </Link>

      {post.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.image_url}
          alt=""
          className="mt-4 max-h-[480px] w-full rounded-2xl border border-surface-border object-cover"
        />
      ) : null}

      {post.type === "poll" && post.poll_options ? (
        <PollBlock
          postId={post.id}
          options={post.poll_options}
          voteCounts={post.poll_vote_counts ?? {}}
          initialMyVote={post.my_poll_vote ?? null}
        />
      ) : null}

      <footer className="mt-5 flex items-center justify-between gap-3">
        <ReactionBar
          postId={post.id}
          initialCounts={post.reaction_counts}
          initialMine={mine}
        />
        <div className="flex items-center gap-1.5">
          <ReportButton entityType="post" entityId={post.id} />
          <Link
            href={`/feed/post/${post.id}`}
            className="inline-flex items-center gap-1.5 rounded-full bg-surface-muted px-3.5 py-1.5 text-xs font-semibold text-ink-secondary transition hover:bg-primary-100 hover:text-primary-700"
          >
            <span className="material-symbols-outlined text-[18px] leading-none">
              chat_bubble
            </span>
            {post.comment_count > 0 ? post.comment_count : "Comment"}
          </Link>
        </div>
      </footer>
    </article>
  );
}
