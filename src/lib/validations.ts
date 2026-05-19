import { z } from "zod";

export const emailSchema = z.string().trim().toLowerCase().email("That doesn't look like a valid email");
export const passwordSchema = z.string().min(8, "Use at least 8 characters");

export const waitlistSchema = z.object({
  email: emailSchema,
  source: z.string().optional(),
});
export type WaitlistInput = z.infer<typeof waitlistSchema>;

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});
export type LoginInput = z.infer<typeof loginSchema>;

export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  invite_code: z
    .string()
    .trim()
    .min(4, "Enter your invite code")
    .max(40)
    .transform((s) => s.toUpperCase()),
});
export type SignupInput = z.infer<typeof signupSchema>;

export const usernameSchema = z
  .string()
  .min(3, "At least 3 characters")
  .max(20, "Max 20 characters")
  .regex(/^[a-z0-9_]+$/, "Lowercase letters, numbers and _ only");

export const onboardingStep1Schema = z.object({
  display_name: z.string().min(2, "Tell us your name").max(50),
  username: usernameSchema,
  avatar_url: z.string().url().optional().nullable(),
});

export const onboardingStep2Schema = z.object({
  current_city_id: z.string().uuid("Pick a city"),
  hometown_city_id: z.string().uuid("Pick a hometown"),
});

export const onboardingStep3Schema = z.object({
  profession: z.string().min(2, "What do you do?").max(80),
  company: z.string().max(80).optional().nullable(),
  show_company: z.boolean().optional(),
  bio: z.string().max(160, "Keep it under 160").optional().nullable(),
});

export const onboardingStep4Schema = z.object({
  vibe_tags: z.array(z.string()).min(3, "Pick at least 3 vibes").max(8, "Max 8 vibes"),
});
