"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function markAllNotificationsRead() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const };
  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("recipient_id", user.id)
    .eq("is_read", false);
  revalidatePath("/notifications");
  revalidatePath("/", "layout");
  return { ok: true as const };
}

export async function markNotificationRead(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const };
  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", id)
    .eq("recipient_id", user.id);
  return { ok: true as const };
}
