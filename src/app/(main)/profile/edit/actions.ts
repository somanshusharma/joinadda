"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type EditProfilePayload = {
  display_name: string;
  bio: string | null;
  current_city_id: string;
  hometown_city_id: string;
  profession: string;
  company: string | null;
  vibe_tags: string[];
};

export async function updateProfile(payload: EditProfilePayload) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not signed in" };

  const update = {
    display_name: payload.display_name.trim(),
    bio: payload.bio?.trim() || null,
    current_city_id: payload.current_city_id,
    hometown_city_id: payload.hometown_city_id,
    profession: payload.profession.trim(),
    company: payload.company?.trim() || null,
    vibe_tags: payload.vibe_tags,
  };

  const { error } = await supabase.from("profiles").update(update).eq("id", user.id);
  if (error) return { ok: false as const, error: error.message };

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();

  revalidatePath("/", "layout");
  redirect(`/profile/${profile?.username ?? ""}`);
}
