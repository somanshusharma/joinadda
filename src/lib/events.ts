import type { SupabaseClient } from "@supabase/supabase-js";
import type { EventCardData } from "@/components/events/EventCard";
import type { AttendeePreview } from "@/components/events/AttendeeStack";

export const EVENT_COLUMNS =
  "id, title, description, cover_image_url, type, location, starts_at, cost_per_person_inr, attendee_count, max_attendees, status, city:city_id(name), organizer:organizer_id(id, username, display_name, avatar_url)";

export async function loadAttendeePreviews(
  supabase: SupabaseClient,
  eventIds: string[],
): Promise<Map<string, AttendeePreview[]>> {
  const map = new Map<string, AttendeePreview[]>();
  if (eventIds.length === 0) return map;

  const { data } = await supabase
    .from("event_rsvps")
    .select(
      "event_id, status, profile:profile_id(id, username, display_name, avatar_url)",
    )
    .in("event_id", eventIds)
    .eq("status", "going")
    .limit(eventIds.length * 6);

  type Row = {
    event_id: string;
    profile: AttendeePreview | null;
  };
  for (const r of (data as unknown as Row[]) ?? []) {
    if (!r.profile) continue;
    const arr = map.get(r.event_id) ?? [];
    if (arr.length < 6) arr.push(r.profile);
    map.set(r.event_id, arr);
  }
  return map;
}

export type EventListItem = EventCardData & { attendees: AttendeePreview[] };
