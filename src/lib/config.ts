export const APP_NAME = "Adda";
export const APP_TAGLINE = "Find your people. Plan real hangouts.";
export const DEFAULT_CITY_SLUG = "mohali";

export const VIBE_OPTIONS = [
  "Gamer", "Cafe hopper", "Foodie", "Trekker", "Reader", "Gym rat",
  "Night owl", "Early bird", "Music head", "Cinephile", "Sports fan",
  "Traveler", "Cricket lover", "Football fan", "Anime fan",
  "Stand-up comedy", "Cycling", "Yoga", "Photography", "Cook",
] as const;

export const REACTION_TYPES = ["relatable", "funny", "fire", "mood", "heart"] as const;
export const REACTION_EMOJI: Record<(typeof REACTION_TYPES)[number], string> = {
  relatable: "🙌",
  funny: "😂",
  fire: "🔥",
  mood: "😮‍💨",
  heart: "❤️",
};
