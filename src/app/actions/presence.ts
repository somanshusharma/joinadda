"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Touch last_seen_at + streak. Called from server layouts.
 * Cheap: one RPC call. Idempotent within the same day.
 *
 * Returns null if the migration `0012_engagement.sql` hasn't been applied yet —
 * the site continues to work without streaks.
 */
export async function touchPresence(userId: string): Promise<number | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("touch_presence", {
      p_user: userId,
    });
    if (error) return null;
    return typeof data === "number" ? data : null;
  } catch {
    // RPC not deployed yet — fail quietly.
    return null;
  }
}
