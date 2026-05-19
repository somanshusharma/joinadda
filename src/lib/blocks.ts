import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Returns all profile ids the current user has blocked OR been blocked by.
 * Filter both directions so they disappear from each other's experience.
 */
export async function loadBlockedIds(
  supabase: SupabaseClient,
  userId: string,
): Promise<Set<string>> {
  const [{ data: mine }, { data: theirs }] = await Promise.all([
    supabase.from("blocks").select("blocked_id").eq("blocker_id", userId),
    supabase.from("blocks").select("blocker_id").eq("blocked_id", userId),
  ]);
  const ids = new Set<string>();
  for (const r of mine ?? []) ids.add((r as { blocked_id: string }).blocked_id);
  for (const r of theirs ?? []) ids.add((r as { blocker_id: string }).blocker_id);
  return ids;
}
