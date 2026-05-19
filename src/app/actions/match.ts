"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function buildIcebreaker({
  hometown,
  sharedVibe,
  currentCity,
}: {
  hometown: string | null;
  sharedVibe: string | null;
  currentCity: string | null;
}) {
  if (hometown) {
    return `Hey! Saw we're both from ${hometown}. How's ${currentCity ?? "your city"} treating you?`;
  }
  if (sharedVibe) {
    return `Hey! JoinAdda matched us — we're both into ${sharedVibe.toLowerCase()}. Got a favourite spot for it?`;
  }
  return "Hey! JoinAdda matched us today — say hi?";
}

export async function skipDailyMatch(matchId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not signed in" };
  const { error } = await supabase
    .from("daily_matches")
    .update({ action: "skipped" })
    .eq("id", matchId)
    .eq("user_id", user.id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/");
  revalidatePath("/match");
  return { ok: true as const };
}

export async function sayHiToMatch(matchId: string, otherProfileId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return redirect("/login");

  // Find or create a DM
  const { data: mine } = await supabase
    .from("conversation_participants")
    .select("conversation_id, conversation:conversation_id(type)")
    .eq("profile_id", user.id);

  const myDmIds = ((mine ?? []) as unknown as {
    conversation_id: string;
    conversation: { type: string } | null;
  }[])
    .filter((r) => r.conversation?.type === "dm")
    .map((r) => r.conversation_id);

  let convId: string | null = null;
  if (myDmIds.length > 0) {
    const { data: theirs } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("profile_id", otherProfileId)
      .in("conversation_id", myDmIds);
    convId = (theirs ?? [])[0]?.conversation_id ?? null;
  }

  if (!convId) {
    const { data: conv } = await supabase
      .from("conversations")
      .insert({ type: "dm" })
      .select("id")
      .single();
    if (!conv) return { ok: false as const, error: "Failed to start chat" };
    convId = conv.id;
    await supabase
      .from("conversation_participants")
      .insert({ conversation_id: convId, profile_id: user.id });
    await supabase
      .from("conversation_participants")
      .insert({ conversation_id: convId, profile_id: otherProfileId });
  }

  // Send an icebreaker
  const [{ data: me }, { data: them }] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "hometown_city_id, vibe_tags, current_city:current_city_id(name)",
      )
      .eq("id", user.id)
      .single<{
        hometown_city_id: string | null;
        vibe_tags: string[];
        current_city: { name: string } | null;
      }>(),
    supabase
      .from("profiles")
      .select("hometown_city_id, vibe_tags, hometown:hometown_city_id(name)")
      .eq("id", otherProfileId)
      .single<{
        hometown_city_id: string | null;
        vibe_tags: string[];
        hometown: { name: string } | null;
      }>(),
  ]);

  let icebreaker = "Hey! JoinAdda matched us today — say hi?";
  if (me && them) {
    const sharedHome =
      me.hometown_city_id &&
      me.hometown_city_id === them.hometown_city_id &&
      them.hometown?.name;
    const sharedVibe =
      me.vibe_tags.find((v) => them.vibe_tags.includes(v)) ?? null;
    icebreaker = buildIcebreaker({
      hometown: sharedHome ? them.hometown!.name : null,
      sharedVibe,
      currentCity: me.current_city?.name ?? null,
    });
  }

  await supabase.from("messages").insert({
    conversation_id: convId,
    sender_id: user.id,
    content: icebreaker,
  });

  await supabase
    .from("daily_matches")
    .update({ action: "said_hi" })
    .eq("id", matchId)
    .eq("user_id", user.id);

  revalidatePath("/");
  revalidatePath("/match");
  redirect(`/chat/${convId}`);
}
