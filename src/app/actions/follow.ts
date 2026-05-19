"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function followUser(targetId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not signed in" };
  if (user.id === targetId) return { ok: false as const, error: "Can't follow yourself" };

  const { error } = await supabase
    .from("follows")
    .insert({ follower_id: user.id, following_id: targetId });
  if (error && !error.message.toLowerCase().includes("duplicate")) {
    return { ok: false as const, error: error.message };
  }
  revalidatePath("/profile/[username]", "page");
  return { ok: true as const };
}

export async function unfollowUser(targetId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not signed in" };

  const { error } = await supabase
    .from("follows")
    .delete()
    .eq("follower_id", user.id)
    .eq("following_id", targetId);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/profile/[username]", "page");
  return { ok: true as const };
}
