"use server";

import { createClient } from "@/lib/supabase/server";

export async function redeemInviteCode(code: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not signed in" };

  const { data, error } = await supabase.rpc("redeem_invite_code", {
    p_code: code.trim().toUpperCase(),
    p_user: user.id,
  });
  if (error) return { ok: false as const, error: error.message };
  if (data !== true) return { ok: false as const, error: "Invalid or used code" };
  return { ok: true as const };
}
