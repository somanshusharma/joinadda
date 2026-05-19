export type City = {
  id: string;
  name: string;
  slug: string;
  state: string;
  display_order: number;
  is_active?: boolean;
};

export type Profile = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  current_city_id: string | null;
  hometown_city_id: string | null;
  profession: string | null;
  company: string | null;
  vibe_tags: string[];
  interests: string[];
  is_onboarded: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
};

export type EventType = "trip" | "workcation" | "hangout" | "community_event";
export type RsvpStatus = "going" | "maybe" | "waitlist" | "cancelled";
export type EventStatus = "open" | "full" | "cancelled" | "completed";

export type EventRow = {
  id: string;
  organizer_id: string;
  community_id: string | null;
  city_id: string;
  title: string;
  description: string;
  cover_image_url: string | null;
  type: EventType;
  category: string | null;
  location: string;
  starts_at: string;
  ends_at: string | null;
  max_attendees: number | null;
  cost_per_person_inr: number;
  cost_notes: string | null;
  status: EventStatus;
  attendee_count: number;
  created_at: string;
  updated_at: string;
};

export type HangoutStatus = "open" | "full" | "happening" | "completed" | "cancelled";
export type HangoutVisibility = "city" | "community" | "connections";
export type HangoutFlexibility = "fixed" | "flexible" | "open";

export type Hangout = {
  id: string;
  host_id: string;
  city_id: string;
  activity: string;
  description: string | null;
  time_window: string;
  starts_at: string | null;
  flexibility: HangoutFlexibility;
  location: string;
  is_location_flexible: boolean;
  max_joiners: number;
  joiner_count: number;
  visibility: HangoutVisibility;
  community_id: string | null;
  status: HangoutStatus;
  conversation_id: string | null;
  created_at: string;
  expires_at: string;
};

export type DailyMatch = {
  id: string;
  user_id: string;
  matched_user_id: string;
  match_date: string;
  match_reason: string | null;
  match_score: number | null;
  action: "pending" | "skipped" | "said_hi";
  created_at: string;
};

export type Community = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  cover_image_url: string | null;
  icon: string | null;
  type: "city" | "hometown_in_city" | "interest" | "company";
  city_id: string | null;
  hometown_id: string | null;
  member_count: number;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
};
