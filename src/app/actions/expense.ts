"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type AddExpenseInput = {
  eventId: string;
  title: string;
  amountInr: number;
  paidBy: string;
  splitBetween: string[]; // profile ids — equal split
  notes?: string | null;
};

async function isAttendee(
  supabase: Awaited<ReturnType<typeof createClient>>,
  eventId: string,
  userId: string,
): Promise<boolean> {
  const { data: event } = await supabase
    .from("events")
    .select("organizer_id")
    .eq("id", eventId)
    .maybeSingle<{ organizer_id: string }>();
  if (event?.organizer_id === userId) return true;
  const { data: rsvp } = await supabase
    .from("event_rsvps")
    .select("status")
    .eq("event_id", eventId)
    .eq("profile_id", userId)
    .eq("status", "going")
    .maybeSingle();
  return !!rsvp;
}

export async function addTripExpense(input: AddExpenseInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Sign in to add expenses" };

  const title = input.title.trim();
  if (!title) return { ok: false as const, error: "Give the expense a name" };
  const amount = Math.round(input.amountInr);
  if (!amount || amount <= 0)
    return { ok: false as const, error: "Amount must be greater than zero" };
  const splitIds = Array.from(new Set(input.splitBetween));
  if (splitIds.length === 0)
    return { ok: false as const, error: "Pick who's splitting this" };

  if (!(await isAttendee(supabase, input.eventId, user.id)))
    return { ok: false as const, error: "Only attendees can add expenses" };

  // Equal split. Distribute the rounding remainder to the first N shares so the total matches.
  const base = Math.floor(amount / splitIds.length);
  const remainder = amount - base * splitIds.length;
  const shares = splitIds.map((id, i) => ({
    profile_id: id,
    share_inr: base + (i < remainder ? 1 : 0),
  }));

  const { data: expense, error } = await supabase
    .from("trip_expenses")
    .insert({
      event_id: input.eventId,
      paid_by: input.paidBy,
      title,
      amount_inr: amount,
      notes: input.notes?.trim() || null,
      created_by: user.id,
    })
    .select("id")
    .single();
  if (error || !expense) {
    return { ok: false as const, error: error?.message ?? "Failed to save" };
  }

  const { error: shareErr } = await supabase.from("trip_expense_shares").insert(
    shares.map((s) => ({
      expense_id: expense.id,
      profile_id: s.profile_id,
      share_inr: s.share_inr,
    })),
  );
  if (shareErr) {
    // Roll back the parent expense if shares failed (RLS error on shares is most common)
    await supabase.from("trip_expenses").delete().eq("id", expense.id);
    return { ok: false as const, error: shareErr.message };
  }

  revalidatePath(`/trips/${input.eventId}`);
  return { ok: true as const };
}

export async function deleteTripExpense(expenseId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const };

  const { data: existing } = await supabase
    .from("trip_expenses")
    .select("event_id, created_by")
    .eq("id", expenseId)
    .maybeSingle<{ event_id: string; created_by: string }>();
  if (!existing || existing.created_by !== user.id)
    return { ok: false as const, error: "Not your expense" };

  const { error } = await supabase
    .from("trip_expenses")
    .delete()
    .eq("id", expenseId);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath(`/trips/${existing.event_id}`);
  return { ok: true as const };
}

export async function recordSettlement(input: {
  eventId: string;
  fromId: string;
  toId: string;
  amountInr: number;
  note?: string | null;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const };
  if (input.amountInr <= 0)
    return { ok: false as const, error: "Amount must be > 0" };

  // Either the payer or the receiver can record it.
  if (user.id !== input.fromId && user.id !== input.toId) {
    return { ok: false as const, error: "Only the pair can settle" };
  }
  if (!(await isAttendee(supabase, input.eventId, user.id))) {
    return { ok: false as const, error: "Only attendees can settle" };
  }

  const { error } = await supabase.from("trip_settlements").insert({
    event_id: input.eventId,
    from_id: input.fromId,
    to_id: input.toId,
    amount_inr: Math.round(input.amountInr),
    note: input.note?.trim() || null,
  });
  if (error) return { ok: false as const, error: error.message };

  revalidatePath(`/trips/${input.eventId}`);
  return { ok: true as const };
}
