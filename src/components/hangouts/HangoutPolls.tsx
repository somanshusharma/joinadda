import { createClient } from "@/lib/supabase/server";
import {
  HangoutPollCard,
  type HangoutPollView,
  type PollOption,
} from "./HangoutPollCard";
import { CreateHangoutPoll } from "./CreateHangoutPoll";

type PollRow = {
  id: string;
  question: string;
  options: PollOption[] | null;
  created_by: string;
  created_at: string;
  creator: { display_name: string } | null;
};

type VoteRow = {
  poll_id: string;
  profile_id: string;
  option_index: number;
};

export async function HangoutPolls({
  hangoutId,
  currentUserId,
  isMember,
}: {
  hangoutId: string;
  currentUserId: string | null;
  isMember: boolean;
}) {
  const supabase = await createClient();

  const { data: pollsData } = await supabase
    .from("hangout_polls")
    .select(
      "id, question, options, created_by, created_at, creator:created_by(display_name)",
    )
    .eq("hangout_id", hangoutId)
    .order("created_at", { ascending: false })
    .limit(8);

  const polls = (pollsData as unknown as PollRow[]) ?? [];

  let voteCounts: Record<string, Record<number, number>> = {};
  let myVotes: Record<string, number> = {};

  if (polls.length > 0) {
    const ids = polls.map((p) => p.id);
    const { data: votes } = await supabase
      .from("hangout_poll_votes")
      .select("poll_id, profile_id, option_index")
      .in("poll_id", ids);

    for (const v of ((votes ?? []) as VoteRow[])) {
      const c = voteCounts[v.poll_id] ?? {};
      c[v.option_index] = (c[v.option_index] ?? 0) + 1;
      voteCounts[v.poll_id] = c;
      if (currentUserId && v.profile_id === currentUserId) {
        myVotes[v.poll_id] = v.option_index;
      }
    }
  }

  const views: HangoutPollView[] = polls.map((p) => ({
    id: p.id,
    question: p.question,
    options: (p.options ?? []) as PollOption[],
    voteCounts: voteCounts[p.id] ?? {},
    myVote: myVotes[p.id] ?? null,
    mine: !!currentUserId && p.created_by === currentUserId,
    createdByName: p.creator?.display_name ?? null,
  }));

  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h3 className="font-display text-lg font-semibold text-ink">
          quick polls
        </h3>
        {views.length > 0 ? (
          <span className="text-xs text-ink-muted">
            {views.length} {views.length === 1 ? "poll" : "polls"}
          </span>
        ) : null}
      </div>

      {views.length === 0 ? (
        <p className="text-sm text-ink-muted">
          No polls yet — ask &ldquo;are you coming?&rdquo; or &ldquo;what
          time?&rdquo; to coordinate the crew.
        </p>
      ) : (
        <div className="space-y-3">
          {views.map((v) => (
            <HangoutPollCard key={v.id} poll={v} canVote={isMember} />
          ))}
        </div>
      )}

      {isMember ? <CreateHangoutPoll hangoutId={hangoutId} /> : null}
    </section>
  );
}
