"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { EventType, RsvpStatus } from "@/lib/types";

export type CreateEventInput = {
  title: string;
  description: string;
  cover_image_url: string | null;
  type: EventType;
  city_id: string;
  community_id: string | null;
  location: string;
  starts_at: string;
  ends_at: string | null;
  max_attendees: number | null;
  cost_per_person_inr: number;
  cost_notes: string | null;
};

export async function createEvent(input: CreateEventInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not signed in" };

  const title = input.title.trim();
  const description = input.description.trim();
  const location = input.location.trim();
  if (title.length < 3) return { ok: false as const, error: "Pick a clear title" };
  if (description.length < 10) return { ok: false as const, error: "Add a few words of context" };
  if (!location) return { ok: false as const, error: "Where's it happening?" };
  if (!input.starts_at) return { ok: false as const, error: "Pick a start time" };

  const { data, error } = await supabase
    .from("events")
    .insert({
      organizer_id: user.id,
      community_id: input.community_id,
      city_id: input.city_id,
      title,
      description,
      cover_image_url: input.cover_image_url,
      type: input.type,
      location,
      starts_at: input.starts_at,
      ends_at: input.ends_at,
      max_attendees: input.max_attendees,
      cost_per_person_inr: input.cost_per_person_inr,
      cost_notes: input.cost_notes?.trim() || null,
    })
    .select("id")
    .single();

  if (error) return { ok: false as const, error: error.message };

  revalidatePath("/trips");
  redirect(`/trips/${data.id}`);
}

export async function setRsvp(eventId: string, status: RsvpStatus | null) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not signed in" };

  if (status === null) {
    const { error } = await supabase
      .from("event_rsvps")
      .delete()
      .eq("event_id", eventId)
      .eq("profile_id", user.id);
    if (error) return { ok: false as const, error: error.message };
  } else {
    const { error } = await supabase
      .from("event_rsvps")
      .upsert({ event_id: eventId, profile_id: user.id, status });
    if (error) return { ok: false as const, error: error.message };
  }

  revalidatePath("/trips");
  revalidatePath(`/trips/${eventId}`);
  return { ok: true as const };
}

export async function cancelEvent(eventId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not signed in" };
  const { error } = await supabase
    .from("events")
    .update({ status: "cancelled" })
    .eq("id", eventId)
    .eq("organizer_id", user.id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath(`/trips/${eventId}`);
  return { ok: true as const };
}
