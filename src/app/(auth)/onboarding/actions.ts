"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type OnboardingPayload = {
  username: string;
  display_name: string;
  current_city_id: string;
  hometown_city_id: string;
  profession: string;
  company: string | null;
  bio: string | null;
  vibe_tags: string[];
};

export async function completeOnboarding(payload: OnboardingPayload) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not signed in" };

  // Upsert profile
  const { error: profileErr } = await supabase.from("profiles").upsert({
    id: user.id,
    username: payload.username,
    display_name: payload.display_name,
    current_city_id: payload.current_city_id,
    hometown_city_id: payload.hometown_city_id,
    profession: payload.profession,
    company: payload.company,
    bio: payload.bio,
    vibe_tags: payload.vibe_tags,
    is_onboarded: true,
  });
  if (profileErr) return { ok: false as const, error: profileErr.message };

  // Auto-join city community
  const { data: cityCommunity } = await supabase
    .from("communities")
    .select("id")
    .eq("type", "city")
    .eq("city_id", payload.current_city_id)
    .maybeSingle();

  if (cityCommunity) {
    await supabase
      .from("community_members")
      .upsert({ community_id: cityCommunity.id, profile_id: user.id });
  }

  // Auto-join hometown-in-city community (find or create)
  if (payload.hometown_city_id !== payload.current_city_id) {
    const { data: htCommunity } = await supabase
      .from("communities")
      .select("id")
      .eq("type", "hometown_in_city")
      .eq("city_id", payload.current_city_id)
      .eq("hometown_id", payload.hometown_city_id)
      .maybeSingle();

    let communityId = htCommunity?.id;
    if (!communityId) {
      const { data: hometown } = await supabase
        .from("cities")
        .select("name")
        .eq("id", payload.hometown_city_id)
        .single();
      const { data: currentCity } = await supabase
        .from("cities")
        .select("name")
        .eq("id", payload.current_city_id)
        .single();
      if (hometown && currentCity) {
        const slug = `${hometown.name}-in-${currentCity.name}`
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");
        const { data: created } = await supabase
          .from("communities")
          .insert({
            slug,
            name: `${hometown.name}is in ${currentCity.name}`,
            description: `People from ${hometown.name} who live in ${currentCity.name}.`,
            icon: "Home",
            type: "hometown_in_city",
            city_id: payload.current_city_id,
            hometown_id: payload.hometown_city_id,
            created_by: user.id,
          })
          .select("id")
          .single();
        communityId = created?.id;
      }
    }
    if (communityId) {
      await supabase
        .from("community_members")
        .upsert({ community_id: communityId, profile_id: user.id });
    }
  }

  revalidatePath("/", "layout");
  redirect("/?welcome=1");
}
