import type { SupabaseClient } from "@supabase/supabase-js";
import type { FeedPost } from "@/components/feed/PostCard";
import type { PollOption } from "@/components/feed/PollBlock";

type RawPost = {
  id: string;
  content: string;
  type: "text" | "image" | "poll" | "question";
  image_url: string | null;
  poll_options: { index: number; label: string }[] | null;
  comment_count: number;
  created_at: string;
  is_anonymous?: boolean;
  anonymous_handle?: string | null;
  author:
    | {
        id: string;
        username: string;
        display_name: string;
        avatar_url: string | null;
        profession: string | null;
      }
    | null;
  community: { slug: string; name: string } | null;
};

const POST_COLUMNS =
  "id, content, type, image_url, poll_options, comment_count, created_at, is_anonymous, anonymous_handle, author:author_id(id, username, display_name, avatar_url, profession), community:community_id(slug, name)";

export async function hydratePosts(
  supabase: SupabaseClient,
  rows: RawPost[],
  currentUserId: string | null,
): Promise<FeedPost[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((p) => p.id);

  const { data: reactions } = await supabase
    .from("reactions")
    .select("post_id, type, profile_id")
    .in("post_id", ids);

  const reactCounts = new Map<string, Record<string, number>>();
  const myReacts = new Map<string, string[]>();
  for (const r of reactions ?? []) {
    const counts = reactCounts.get(r.post_id) ?? {};
    counts[r.type] = (counts[r.type] ?? 0) + 1;
    reactCounts.set(r.post_id, counts);
    if (currentUserId && r.profile_id === currentUserId) {
      const mine = myReacts.get(r.post_id) ?? [];
      mine.push(r.type);
      myReacts.set(r.post_id, mine);
    }
  }

  const pollIds = rows.filter((p) => p.type === "poll").map((p) => p.id);
  const pollVoteCounts = new Map<string, Record<number, number>>();
  const myVotes = new Map<string, number>();
  if (pollIds.length > 0) {
    const { data: votes } = await supabase
      .from("poll_votes")
      .select("post_id, profile_id, option_index")
      .in("post_id", pollIds);
    for (const v of votes ?? []) {
      const c = pollVoteCounts.get(v.post_id) ?? {};
      c[v.option_index] = (c[v.option_index] ?? 0) + 1;
      pollVoteCounts.set(v.post_id, c);
      if (currentUserId && v.profile_id === currentUserId) {
        myVotes.set(v.post_id, v.option_index);
      }
    }
  }

  return rows
    .filter((p): p is RawPost & { author: NonNullable<RawPost["author"]> } => p.author !== null)
    .map((p) => ({
      id: p.id,
      content: p.content,
      type: p.type,
      image_url: p.image_url,
      poll_options: (p.poll_options as PollOption[] | null) ?? null,
      comment_count: p.comment_count,
      created_at: p.created_at,
      is_anonymous: !!p.is_anonymous,
      anonymous_handle: p.anonymous_handle ?? null,
      author: p.author,
      community: p.community,
      reaction_counts: reactCounts.get(p.id) ?? {},
      my_reactions: myReacts.get(p.id) ?? [],
      poll_vote_counts: pollVoteCounts.get(p.id) ?? {},
      my_poll_vote: myVotes.get(p.id) ?? null,
    }));
}

export { POST_COLUMNS };
export type { RawPost };
