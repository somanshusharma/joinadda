import { redirect } from "next/navigation";
import Link from "next/link";
import { Heart } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/EmptyState";
import { Avatar } from "@/components/ui/Avatar";
import { DailyMatchCard } from "@/components/match/DailyMatchCard";
import { getOrPickDailyMatch } from "@/lib/match";
import { timeAgo } from "@/lib/utils";

type HistoryAction = "pending" | "skipped" | "said_hi";

const ACTION_STYLES: Record<HistoryAction, { bg: string; text: string; label: string }> = {
  said_hi: {
    bg: "bg-tertiary-fixed/60",
    text: "text-[#3F4A39]",
    label: "Said hi",
  },
  skipped: {
    bg: "bg-surface-muted",
    text: "text-ink-muted",
    label: "Skipped",
  },
  pending: {
    bg: "bg-peach/60",
    text: "text-[#802A00]",
    label: "Pending",
  },
};

export default async function MatchPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const todayMatch = await getOrPickDailyMatch(supabase, user.id);

  const { data: historyData } = await supabase
    .from("daily_matches")
    .select(
      "id, match_date, match_reason, action, matched:matched_user_id(id, username, display_name, avatar_url, profession)",
    )
    .eq("user_id", user.id)
    .order("match_date", { ascending: false })
    .limit(20);

  type HistoryRow = {
    id: string;
    match_date: string;
    match_reason: string | null;
    action: HistoryAction;
    matched: {
      id: string;
      username: string;
      display_name: string;
      avatar_url: string | null;
      profession: string | null;
    } | null;
  };
  const history = ((historyData as unknown as HistoryRow[]) ?? []).filter(
    (h) => h.matched !== null,
  );

  return (
    <div className="max-w-2xl pb-8">
      {/* Header */}
      <section className="mb-10">
        <h1 className="font-serif text-3xl md:text-4xl font-semibold tracking-tight text-ink leading-tight mb-2">
          daily match
        </h1>
        <p className="text-base text-ink-secondary">
          One person a day. No swiping, no pressure.
        </p>
      </section>

      {/* Today's card */}
      <section className="mb-12">
        {todayMatch ? (
          <DailyMatchCard match={todayMatch} />
        ) : (
          <EmptyState
            icon={<Heart />}
            title="No match today."
            description="Not enough people in your city yet. Invite a friend?"
          />
        )}
      </section>

      {/* Past connections */}
      {history.length > 0 ? (
        <section>
          <div className="flex items-baseline justify-between mb-5">
            <h3 className="font-display text-2xl font-semibold text-ink lowercase">
              past connections
            </h3>
          </div>
          <div className="space-y-3">
            {history.map((h) => {
              const style = ACTION_STYLES[h.action];
              return (
                <Link
                  key={h.id}
                  href={`/profile/${h.matched!.username}`}
                  className="bg-surface-low p-4 rounded-2xl flex items-center justify-between gap-3 hover:bg-surface-muted transition-colors group"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <Avatar
                      name={h.matched!.display_name}
                      src={h.matched!.avatar_url}
                      seed={h.matched!.id}
                      size="md"
                    />
                    <div className="min-w-0">
                      <p className="font-display text-base font-semibold text-ink leading-tight">
                        {h.matched!.display_name}
                      </p>
                      <p className="text-sm text-ink-muted truncate">
                        {h.match_reason ?? "in your city"} ·{" "}
                        {timeAgo(h.match_date)}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`shrink-0 ${style.bg} ${style.text} px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide`}
                  >
                    {style.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}
