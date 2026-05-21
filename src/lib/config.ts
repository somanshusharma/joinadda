export const APP_NAME = "JoinAdda";
export const APP_WORDMARK = "joinadda";
export const APP_TAGLINE = "Meet, Travel, Hangout";
export const DEFAULT_CITY_SLUG = "mohali";

export const VIBE_OPTIONS = [
  "Gamer", "Cafe hopper", "Foodie", "Trekker", "Reader", "Gym rat",
  "Night owl", "Early bird", "Music head", "Cinephile", "Sports fan",
  "Traveler", "Cricket lover", "Football fan", "Anime fan",
  "Stand-up comedy", "Cycling", "Yoga", "Photography", "Cook",
] as const;

export type ActivityTag = {
  slug: string;
  label: string;
  icon: string; // Material Symbol name
};

export const ACTIVITY_TAGS: readonly ActivityTag[] = [
  { slug: "cricket", label: "Cricket", icon: "sports_cricket" },
  { slug: "football", label: "Football", icon: "sports_soccer" },
  { slug: "badminton", label: "Badminton", icon: "sports_tennis" },
  { slug: "basketball", label: "Basketball", icon: "sports_basketball" },
  { slug: "yoga", label: "Yoga", icon: "self_improvement" },
  { slug: "gym", label: "Gym / Workout", icon: "fitness_center" },
  { slug: "run", label: "Running", icon: "directions_run" },
  { slug: "cycling", label: "Cycling", icon: "directions_bike" },
  { slug: "trek", label: "Trek / Hike", icon: "hiking" },
  { slug: "brunch", label: "Brunch / Food", icon: "restaurant" },
  { slug: "coffee", label: "Coffee / Cafe", icon: "local_cafe" },
  { slug: "board_games", label: "Board games", icon: "casino" },
  { slug: "pool", label: "Pool / Snooker", icon: "sports_bar" },
  { slug: "bowling", label: "Bowling", icon: "sports" },
  { slug: "paintball", label: "Paintball", icon: "track_changes" },
  { slug: "pottery", label: "Pottery / Craft", icon: "palette" },
  { slug: "comedy", label: "Comedy", icon: "theater_comedy" },
  { slug: "movie", label: "Movie", icon: "movie" },
  { slug: "book_club", label: "Book club", icon: "menu_book" },
  { slug: "volunteer", label: "Volunteering", icon: "volunteer_activism" },
  { slug: "other", label: "Other", icon: "more_horiz" },
] as const;

export function activityLabel(slug: string | null | undefined): string {
  if (!slug) return "Other";
  return ACTIVITY_TAGS.find((t) => t.slug === slug)?.label ?? "Other";
}

export function activityIcon(slug: string | null | undefined): string {
  if (!slug) return "more_horiz";
  return ACTIVITY_TAGS.find((t) => t.slug === slug)?.icon ?? "more_horiz";
}

export const REACTION_TYPES = ["relatable", "funny", "fire", "mood", "heart"] as const;
export const REACTION_EMOJI: Record<(typeof REACTION_TYPES)[number], string> = {
  relatable: "🙌",
  funny: "😂",
  fire: "🔥",
  mood: "😮‍💨",
  heart: "❤️",
};
