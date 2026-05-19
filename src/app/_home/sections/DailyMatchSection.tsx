import { createClient } from "@/lib/supabase/server";
import { DailyMatchCard } from "@/components/match/DailyMatchCard";
import { getOrPickDailyMatch } from "@/lib/match";

export async function DailyMatchSection({ userId }: { userId: string }) {
  const supabase = await createClient();
  const match = await getOrPickDailyMatch(supabase, userId);

  if (!match) {
    return (
      <p className="text-sm text-ink-muted">
        We&apos;ll have a match for you tomorrow. (More people in your city = better matches.)
      </p>
    );
  }

  return (
    <DailyMatchCard
      match={{
        match_id: match.match_id,
        reason: match.reason,
        action: match.action,
        candidate: {
          id: match.candidate.id,
          username: match.candidate.username,
          display_name: match.candidate.display_name,
          avatar_url: match.candidate.avatar_url,
          profession: match.candidate.profession,
          bio: match.candidate.bio,
          vibe_tags: match.candidate.vibe_tags,
        },
      }}
    />
  );
}
