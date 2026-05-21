"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ReviewSubjectType = "profile" | "spot" | "trip" | "hangout";

export type CreateReviewInput = {
  subject_type: ReviewSubjectType;
  subject_id: string;
  rating: number;
  review_text?: string | null;
  context_type?: "hangout" | "trip" | null;
  context_id?: string | null;
};

export async function upsertReview(input: CreateReviewInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not signed in" };

  if (input.rating < 1 || input.rating > 5) {
    return { ok: false as const, error: "Rating must be 1–5" };
  }

  if (input.subject_type === "profile" && input.subject_id === user.id) {
    return { ok: false as const, error: "You can't review yourself" };
  }

  const text = (input.review_text ?? "").trim().slice(0, 1000) || null;

  // Upsert (one review per reviewer per subject)
  const { error } = await supabase.from("reviews").upsert(
    {
      reviewer_id: user.id,
      subject_type: input.subject_type,
      subject_id: input.subject_id,
      rating: input.rating,
      review_text: text,
      context_type: input.context_type ?? null,
      context_id: input.context_id ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "reviewer_id,subject_type,subject_id" },
  );
  if (error) return { ok: false as const, error: error.message };

  // Revalidate likely surfaces
  if (input.subject_type === "profile") {
    revalidatePath(`/profile`);
  } else if (input.subject_type === "spot") {
    revalidatePath(`/spots/${input.subject_id}`);
    revalidatePath(`/spots`);
  } else if (input.subject_type === "trip") {
    revalidatePath(`/trips/${input.subject_id}`);
    revalidatePath(`/trips`);
  } else if (input.subject_type === "hangout") {
    revalidatePath(`/hangouts/${input.subject_id}`);
  }
  return { ok: true as const };
}

export async function deleteReview(reviewId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not signed in" };

  const { error } = await supabase
    .from("reviews")
    .delete()
    .eq("id", reviewId)
    .eq("reviewer_id", user.id);
  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const };
}
