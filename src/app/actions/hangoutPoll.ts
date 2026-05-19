"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type CreateInput = {
  hangoutId: string;
  question: string;
  options: string[];
};

async function isMember(
  supabase: Awaited<ReturnType<typeof createClient>>,
  hangoutId: string,
  userId: string,
): Promise<boolean> {
  const { data: hangout } = await supabase
    .from("hangouts")
    .select("host_id")
    .eq("id", hangoutId)
    .maybeSingle<{ host_id: string }>();
  if (hangout?.host_id === userId) return true;

  const { data: joiner } = await supabase
    .from("hangout_joiners")
    .select("status")
    .eq("hangout_id", hangoutId)
    .eq("profile_id", userId)
    .eq("status", "going")
    .maybeSingle();
  return !!joiner;
}

export async function createHangoutPoll(input: CreateInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Sign in to ask the crew" };

  const question = input.question.trim();
  if (question.length < 3) {
    return { ok: false as const, error: "What do you want to ask?" };
  }
  const cleanOptions = (input.options ?? [])
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .slice(0, 6);
  if (cleanOptions.length < 2) {
    return { ok: false as const, error: "Give at least 2 options" };
  }

  const member = await isMember(supabase, input.hangoutId, user.id);
  if (!member)
    return { ok: false as const, error: "Only people in the hangout can ask" };

  const { error } = await supabase.from("hangout_polls").insert({
    hangout_id: input.hangoutId,
    created_by: user.id,
    question,
    options: cleanOptions.map((label, i) => ({ index: i, label })),
  });
  if (error) return { ok: false as const, error: error.message };

  revalidatePath(`/hangouts/${input.hangoutId}`);
  return { ok: true as const };
}

export async function voteOnHangoutPoll(pollId: string, optionIndex: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Sign in to vote" };

  // Upsert via PK (poll_id, profile_id) — handle both insert + change-vote in one call.
  const { error } = await supabase
    .from("hangout_poll_votes")
    .upsert(
      { poll_id: pollId, profile_id: user.id, option_index: optionIndex },
      { onConflict: "poll_id,profile_id" },
    );
  if (error) return { ok: false as const, error: error.message };

  // Best-effort revalidate of the parent hangout page.
  const { data: poll } = await supabase
    .from("hangout_polls")
    .select("hangout_id")
    .eq("id", pollId)
    .maybeSingle<{ hangout_id: string }>();
  if (poll) revalidatePath(`/hangouts/${poll.hangout_id}`);
  return { ok: true as const };
}

export async function deleteHangoutPoll(pollId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const };
  const { data: poll } = await supabase
    .from("hangout_polls")
    .select("created_by, hangout_id")
    .eq("id", pollId)
    .maybeSingle<{ created_by: string; hangout_id: string }>();
  if (!poll || poll.created_by !== user.id)
    return { ok: false as const, error: "Not your poll" };

  const { error } = await supabase.from("hangout_polls").delete().eq("id", pollId);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath(`/hangouts/${poll.hangout_id}`);
  return { ok: true as const };
}
