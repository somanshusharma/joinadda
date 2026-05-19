"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function joinCommunity(communityId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not signed in" };

  const { error } = await supabase
    .from("community_members")
    .insert({ community_id: communityId, profile_id: user.id });

  if (error && !error.message.toLowerCase().includes("duplicate")) {
    return { ok: false as const, error: error.message };
  }
  revalidatePath("/communities");
  revalidatePath("/communities/[slug]", "page");
  return { ok: true as const };
}

export async function leaveCommunity(communityId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not signed in" };

  const { error } = await supabase
    .from("community_members")
    .delete()
    .eq("community_id", communityId)
    .eq("profile_id", user.id);

  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/communities");
  revalidatePath("/communities/[slug]", "page");
  return { ok: true as const };
}
