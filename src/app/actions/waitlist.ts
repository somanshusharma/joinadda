"use server";

import { createClient } from "@/lib/supabase/server";
import { waitlistSchema } from "@/lib/validations";

export async function joinWaitlist(input: { email: string; source?: string }) {
  const parsed = waitlistSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "Invalid email",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("waitlist").insert({
    email: parsed.data.email,
    source: parsed.data.source ?? null,
  });

  if (error) {
    if (error.message.toLowerCase().includes("duplicate")) {
      return { ok: true as const, alreadyOn: true };
    }
    return { ok: false as const, error: error.message };
  }

  return { ok: true as const, alreadyOn: false };
}
