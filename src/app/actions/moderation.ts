"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ReportEntity = "profile" | "post" | "comment" | "event" | "message";

export async function reportEntity({
  entityType,
  entityId,
  reason,
  notes,
}: {
  entityType: ReportEntity;
  entityId: string;
  reason: string;
  notes?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not signed in" };
  if (!reason.trim()) return { ok: false as const, error: "Pick a reason" };

  const { error } = await supabase.from("reports").insert({
    reporter_id: user.id,
    entity_type: entityType,
    entity_id: entityId,
    reason: reason.trim(),
    notes: notes?.trim() || null,
  });
  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const };
}

export async function blockUser(targetId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not signed in" };
  if (user.id === targetId) return { ok: false as const, error: "Can't block yourself" };

  const { error } = await supabase
    .from("blocks")
    .insert({ blocker_id: user.id, blocked_id: targetId });
  if (error && !error.message.toLowerCase().includes("duplicate")) {
    return { ok: false as const, error: error.message };
  }

  // Unfollow both ways for cleanliness
  await supabase
    .from("follows")
    .delete()
    .or(
      `and(follower_id.eq.${user.id},following_id.eq.${targetId}),and(follower_id.eq.${targetId},following_id.eq.${user.id})`,
    );

  revalidatePath("/", "layout");
  return { ok: true as const };
}

export async function unblockUser(targetId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not signed in" };
  const { error } = await supabase
    .from("blocks")
    .delete()
    .eq("blocker_id", user.id)
    .eq("blocked_id", targetId);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/", "layout");
  return { ok: true as const };
}

export async function resolveReport(reportId: string, action: "resolve" | "dismiss") {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not signed in" };

  const { data: me } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single<{ is_admin: boolean }>();
  if (!me?.is_admin) return { ok: false as const, error: "Not an admin" };

  const { error } = await supabase
    .from("reports")
    .update({
      status: action === "resolve" ? "resolved" : "dismissed",
      resolved_by: user.id,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", reportId);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/admin");
  return { ok: true as const };
}

export async function softDeletePost(postId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not signed in" };
  const { data: me } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single<{ is_admin: boolean }>();
  if (!me?.is_admin) return { ok: false as const, error: "Not an admin" };

  const { error } = await supabase
    .from("posts")
    .update({ is_deleted: true })
    .eq("id", postId);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/admin");
  return { ok: true as const };
}
