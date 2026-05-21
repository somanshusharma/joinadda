"use server";

import { createClient } from "@/lib/supabase/server";

export type ListingCard = {
  id: string;
  title: string;
  activity_tag: string;
  address: string | null;
  price_inr: number | null;
  price_unit: "per_hour" | "per_person" | "per_session" | "flat" | null;
  capacity_min: number | null;
  capacity_max: number | null;
  photo_url: string | null;
  is_featured: boolean;
};

export async function fetchListingsForActivity(
  cityId: string | null,
  activityTag: string,
): Promise<ListingCard[]> {
  if (!cityId || !activityTag) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("host_listings")
    .select(
      "id, title, activity_tag, address, price_inr, price_unit, capacity_min, capacity_max, photo_url, is_featured",
    )
    .eq("city_id", cityId)
    .eq("activity_tag", activityTag)
    .eq("is_active", true)
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(10);
  return (data as ListingCard[]) ?? [];
}
