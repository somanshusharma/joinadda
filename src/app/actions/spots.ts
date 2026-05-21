"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type CreateSpotInput = {
  title: string;
  description: string;
  activity_tag: string;
  address: string;
  map_url: string;
  price_inr: string; // raw input from form
  price_unit: "per_hour" | "per_person" | "per_session" | "flat" | "";
  capacity_min: number;
  capacity_max: number;
  contact_phone: string;
  contact_whatsapp: string;
  contact_email: string;
  photo_url: string;
};

export async function createSpot(input: CreateSpotInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not signed in" };

  const { data: me } = await supabase
    .from("profiles")
    .select("current_city_id, can_add_spots, is_admin")
    .eq("id", user.id)
    .single<{
      current_city_id: string | null;
      can_add_spots: boolean;
      is_admin: boolean;
    }>();

  if (!me?.can_add_spots && !me?.is_admin) {
    return { ok: false as const, error: "You don't have access to add spots yet." };
  }
  if (!me.current_city_id) {
    return { ok: false as const, error: "Set your city in your profile first" };
  }

  const title = input.title.trim();
  const activity_tag = input.activity_tag.trim();
  if (title.length < 3) return { ok: false as const, error: "Title is too short" };
  if (!activity_tag) return { ok: false as const, error: "Pick an activity" };

  const priceTrimmed = input.price_inr.trim();
  const price_inr = priceTrimmed === "" ? null : Number(priceTrimmed);
  if (price_inr != null && (Number.isNaN(price_inr) || price_inr < 0)) {
    return { ok: false as const, error: "Price must be a number" };
  }

  const { data, error } = await supabase
    .from("host_listings")
    .insert({
      host_id: user.id,
      city_id: me.current_city_id,
      title,
      description: input.description.trim() || null,
      activity_tag,
      address: input.address.trim() || null,
      map_url: input.map_url.trim() || null,
      price_inr,
      price_unit: price_inr == null ? null : input.price_unit || "per_hour",
      capacity_min: Math.max(1, input.capacity_min),
      capacity_max: Math.max(input.capacity_min, input.capacity_max),
      contact_phone: input.contact_phone.trim() || null,
      contact_whatsapp: input.contact_whatsapp.trim() || null,
      contact_email: input.contact_email.trim() || null,
      photo_url: input.photo_url.trim() || null,
      is_active: true,
    })
    .select("id")
    .single();

  if (error) return { ok: false as const, error: error.message };

  revalidatePath("/spots");
  redirect(`/spots/${data.id}`);
}
