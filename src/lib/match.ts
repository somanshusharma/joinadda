import type { SupabaseClient } from "@supabase/supabase-js";

type Me = {
  id: string;
  hometown_city_id: string | null;
  current_city_id: string | null;
  profession: string | null;
  vibe_tags: string[];
};

type Candidate = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  profession: string | null;
  hometown_city_id: string | null;
  vibe_tags: string[];
  hometown: { name: string } | null;
};

export type MatchResult = {
  candidate: Candidate;
  score: number;
  reason: string;
};

function similarProfession(a: string | null, b: string | null) {
  if (!a || !b) return false;
  const norm = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z\s]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  const A = norm(a);
  const B = norm(b);
  if (!A || !B) return false;
  if (A === B) return true;

  const KEYWORDS = [
    "dev",
    "engineer",
    "designer",
    "product manager",
    "pm",
    "data",
    "founder",
    "marketer",
    "writer",
    "analyst",
  ];
  return KEYWORDS.some((k) => A.includes(k) && B.includes(k));
}

function calculateScore(me: Me, them: Candidate): number {
  let score = 0;

  if (me.hometown_city_id && me.hometown_city_id === them.hometown_city_id)
    score += 0.35;

  const sharedVibes = me.vibe_tags.filter((v) => them.vibe_tags.includes(v));
  score += Math.min(sharedVibes.length * 0.1, 0.3);

  if (similarProfession(me.profession, them.profession)) score += 0.15;

  return score;
}

function buildReason(me: Me, them: Candidate): string {
  const reasons: string[] = [];

  if (
    me.hometown_city_id &&
    me.hometown_city_id === them.hometown_city_id &&
    them.hometown?.name
  ) {
    reasons.push(`Also from ${them.hometown.name}`);
  }

  const sharedVibes = me.vibe_tags.filter((v) => them.vibe_tags.includes(v));
  if (sharedVibes.length > 0) {
    reasons.push(`also into ${sharedVibes[0].toLowerCase()}`);
  }

  if (similarProfession(me.profession, them.profession) && them.profession) {
    reasons.push(`also a ${them.profession.toLowerCase()}`);
  }

  if (reasons.length === 0) reasons.push("in your city");

  return reasons.slice(0, 2).join(", ");
}

/**
 * Find or pick today's match for the given user, persist it, and return the candidate + reason.
 * Returns null if no candidates exist.
 */
export async function getOrPickDailyMatch(
  supabase: SupabaseClient,
  userId: string,
): Promise<
  | {
      match_id: string;
      candidate: Candidate;
      reason: string;
      action: "pending" | "skipped" | "said_hi";
    }
  | null
> {
  // 1) Look for an existing match today
  const today = new Date().toISOString().slice(0, 10);
  const { data: existing } = await supabase
    .from("daily_matches")
    .select(
      "id, matched_user_id, match_reason, action, matched:matched_user_id(id, username, display_name, avatar_url, bio, profession, hometown_city_id, vibe_tags, hometown:hometown_city_id(name))",
    )
    .eq("user_id", userId)
    .eq("match_date", today)
    .maybeSingle();

  if (existing) {
    type ExistingRow = {
      id: string;
      matched_user_id: string;
      match_reason: string | null;
      action: "pending" | "skipped" | "said_hi";
      matched: Candidate | null;
    };
    const e = existing as unknown as ExistingRow;
    if (!e.matched) return null;
    return {
      match_id: e.id,
      candidate: e.matched,
      reason: e.match_reason ?? "in your city",
      action: e.action,
    };
  }

  // 2) Get me
  const { data: meRow } = await supabase
    .from("profiles")
    .select(
      "id, hometown_city_id, current_city_id, profession, vibe_tags",
    )
    .eq("id", userId)
    .single<Me>();
  if (!meRow || !meRow.current_city_id) return null;
  const me = meRow;

  // 3) 30-day cooldown
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data: recent } = await supabase
    .from("match_history")
    .select("matched_user_id")
    .eq("user_id", userId)
    .gte("last_matched_at", cutoff);
  const recentIds = new Set(
    (recent ?? []).map((r) => (r as { matched_user_id: string }).matched_user_id),
  );

  // 4) Get candidates: same city, onboarded, not me, not recently matched
  const { data: candData } = await supabase
    .from("profiles")
    .select(
      "id, username, display_name, avatar_url, bio, profession, hometown_city_id, vibe_tags, hometown:hometown_city_id(name)",
    )
    .eq("current_city_id", me.current_city_id)
    .eq("is_onboarded", true)
    .neq("id", userId)
    .limit(200);

  const candidates = ((candData as unknown as Candidate[]) ?? []).filter(
    (c) => !recentIds.has(c.id),
  );
  if (candidates.length === 0) return null;

  // 5) Rank and pick the top
  const ranked = candidates
    .map((c) => ({
      candidate: c,
      score: calculateScore(me, c),
      reason: buildReason(me, c),
    }))
    .sort((a, b) => b.score - a.score);
  const pick = ranked[0];
  if (!pick) return null;

  // 6) Persist (best-effort)
  const { data: inserted } = await supabase
    .from("daily_matches")
    .insert({
      user_id: userId,
      matched_user_id: pick.candidate.id,
      match_date: today,
      match_reason: pick.reason,
      match_score: Number(pick.score.toFixed(2)),
      action: "pending",
    })
    .select("id")
    .single();

  await supabase
    .from("match_history")
    .upsert(
      {
        user_id: userId,
        matched_user_id: pick.candidate.id,
        last_matched_at: new Date().toISOString(),
      },
      { onConflict: "user_id,matched_user_id" },
    );

  return {
    match_id: inserted?.id ?? "",
    candidate: pick.candidate,
    reason: pick.reason,
    action: "pending",
  };
}
