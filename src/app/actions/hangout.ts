"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type CreateHangoutInput = {
  activity: string;
  description: string | null;
  time_window: string;
  starts_at: string | null;
  location: string;
  max_joiners: number;
};

export async function createHangout(input: CreateHangoutInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not signed in" };

  const activity = input.activity.trim();
  const location = input.location.trim();
  if (activity.length < 2) return { ok: false as const, error: "What do you want to do?" };
  if (!location) return { ok: false as const, error: "Where? (or 'anywhere in your city')" };

  const { data: me } = await supabase
    .from("profiles")
    .select("current_city_id")
    .eq("id", user.id)
    .single<{ current_city_id: string | null }>();
  if (!me?.current_city_id) {
    return { ok: false as const, error: "Set your city in your profile first" };
  }

  const { data, error } = await supabase
    .from("hangouts")
    .insert({
      host_id: user.id,
      city_id: me.current_city_id,
      activity,
      description: input.description?.trim() || null,
      time_window: input.time_window,
      starts_at: input.starts_at,
      location,
      max_joiners: Math.max(2, Math.min(10, input.max_joiners)),
      visibility: "city",
    })
    .select("id")
    .single();

  if (error) return { ok: false as const, error: error.message };

  revalidatePath("/hangouts");
  revalidatePath("/");
  redirect(`/hangouts/${data.id}`);
}

export async function joinHangout(hangoutId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not signed in" };

  const { error } = await supabase
    .from("hangout_joiners")
    .upsert({ hangout_id: hangoutId, profile_id: user.id, status: "going" });
  if (error) return { ok: false as const, error: error.message };

  revalidatePath("/hangouts");
  revalidatePath(`/hangouts/${hangoutId}`);
  revalidatePath("/");
  return { ok: true as const };
}

export async function leaveHangout(hangoutId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not signed in" };

  const { error } = await supabase
    .from("hangout_joiners")
    .delete()
    .eq("hangout_id", hangoutId)
    .eq("profile_id", user.id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath(`/hangouts/${hangoutId}`);
  return { ok: true as const };
}

export async function cancelHangout(hangoutId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not signed in" };
  const { error } = await supabase
    .from("hangouts")
    .update({ status: "cancelled" })
    .eq("id", hangoutId)
    .eq("host_id", user.id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath(`/hangouts/${hangoutId}`);
  return { ok: true as const };
}
