"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function sendMessage(conversationId: string, content: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not signed in" };

  const text = content.trim();
  if (!text) return { ok: false as const, error: "Empty message" };
  if (text.length > 4000) return { ok: false as const, error: "Too long" };

  const { error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content: text,
    });
  if (error) return { ok: false as const, error: error.message };

  await supabase
    .from("conversation_participants")
    .update({ last_read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .eq("profile_id", user.id);

  revalidatePath("/chat");
  return { ok: true as const };
}

export async function markRead(conversationId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const };
  await supabase
    .from("conversation_participants")
    .update({ last_read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .eq("profile_id", user.id);
  return { ok: true as const };
}

export async function startDM(otherProfileId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return redirect("/login");
  if (user.id === otherProfileId) return { ok: false as const, error: "Can't DM yourself" };

  // Find an existing DM that has exactly these two participants
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

  if (myDmIds.length > 0) {
    const { data: theirs } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("profile_id", otherProfileId)
      .in("conversation_id", myDmIds);
    const match = (theirs ?? [])[0]?.conversation_id;
    if (match) redirect(`/chat/${match}`);
  }

  const { data: conv, error: convErr } = await supabase
    .from("conversations")
    .insert({ type: "dm" })
    .select("id")
    .single();
  if (convErr || !conv) return { ok: false as const, error: convErr?.message ?? "Failed" };

  const { error: meErr } = await supabase
    .from("conversation_participants")
    .insert({ conversation_id: conv.id, profile_id: user.id });
  if (meErr) return { ok: false as const, error: meErr.message };

  const { error: themErr } = await supabase
    .from("conversation_participants")
    .insert({ conversation_id: conv.id, profile_id: otherProfileId });
  if (themErr) return { ok: false as const, error: themErr.message };

  redirect(`/chat/${conv.id}`);
}

export async function openEventChat(eventId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return redirect("/login");

  const { data: conv } = await supabase
    .from("conversations")
    .select("id")
    .eq("event_id", eventId)
    .eq("type", "event_group")
    .maybeSingle();

  if (!conv) return { ok: false as const, error: "No chat for this event yet" };
  redirect(`/chat/${conv.id}`);
}
