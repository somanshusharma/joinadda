"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type LeadStatus = "new" | "contacted" | "confirmed" | "cancelled" | "completed";

export async function updateLeadStatus(leadId: string, status: LeadStatus) {
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
  if (!me?.is_admin) return { ok: false as const, error: "Not allowed" };

  const { error } = await supabase
    .from("host_leads")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", leadId);
  if (error) return { ok: false as const, error: error.message };

  revalidatePath("/admin/leads");
  return { ok: true as const };
}
