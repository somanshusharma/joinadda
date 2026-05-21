import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { hydratePosts, POST_COLUMNS, type RawPost } from "@/lib/feed";

export async function FeedPreview({ userId }: { userId: string | null }) {
  const supabase = await createClient();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: postsData } = await supabase
    .from("posts")
    .select(POST_COLUMNS)
    .gte("created_at", since)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false })
    .limit(30);

  const posts = (postsData as unknown as RawPost[]) ?? [];
  if (posts.length === 0) {
    return (
      <div className="bg-sky/40 rounded-3xl border border-sky/60 p-6">
        <p className="text-sm text-ink-secondary">
          Quiet in the addas today. Drop the first hot take →{" "}
          <Link href="/feed" className="font-semibold text-primary-600">
            tap +
          </Link>
        </p>
      </div>
    );
  }

  const hydrated = await hydratePosts(supabase, posts, userId);
  const ranked = [...hydrated].sort((a, b) => {
    const sum = (r: typeof a) =>
      Object.values(r.reaction_counts).reduce((s, n) => s + n, 0);
    return sum(b) - sum(a);
  });
  const top = ranked.slice(0, 2);

  return (
    <div className="space-y-4">
      {top.map((p) => {
        const totalReactions = Object.values(p.reaction_counts).reduce(
          (s, n) => s + n,
          0,
        );
        const displayName = p.is_anonymous
          ? p.anonymous_handle ?? "Anonymous"
          : p.author.display_name;
        const href = `/feed/post/${p.id}`;
        return (
          <Link
            key={p.id}
            href={href}
            className="block bg-white border-2 border-dashed border-surface-border rounded-3xl p-6 hover:border-primary-200 transition-colors"
          >
            <p className="font-serif italic text-lg leading-relaxed text-ink mb-4">
              &ldquo;{p.content.length > 180 ? p.content.slice(0, 180) + "…" : p.content}&rdquo;
            </p>
            <div className="flex items-center justify-between gap-3">
              <span className="font-sticker text-base text-primary-600/80">
                — {displayName}
              </span>
              {totalReactions > 0 ? (
                <span className="text-xs text-ink-muted">
                  {totalReactions} reaction{totalReactions === 1 ? "" : "s"}
                </span>
              ) : null}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
