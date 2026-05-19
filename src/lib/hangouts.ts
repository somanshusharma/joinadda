import type { SupabaseClient } from "@supabase/supabase-js";

export type HangoutJoinerPreview = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
};

/**
 * Batch-load up to 5 going joiners per hangout. Returns a Map keyed by hangout_id.
 */
export async function loadJoinerPreviews(
  supabase: SupabaseClient,
  hangoutIds: string[],
): Promise<Map<string, HangoutJoinerPreview[]>> {
  const map = new Map<string, HangoutJoinerPreview[]>();
  if (hangoutIds.length === 0) return map;

  const { data } = await supabase
    .from("hangout_joiners")
    .select(
      "hangout_id, profile:profile_id(id, username, display_name, avatar_url)",
    )
    .in("hangout_id", hangoutIds)
    .eq("status", "going")
    .limit(hangoutIds.length * 6);

  type Row = {
    hangout_id: string;
    profile: HangoutJoinerPreview | null;
  };
  for (const r of ((data ?? []) as unknown as Row[])) {
    if (!r.profile) continue;
    const arr = map.get(r.hangout_id) ?? [];
    if (arr.length < 5) arr.push(r.profile);
    map.set(r.hangout_id, arr);
  }
  return map;
}
