"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function toggleMetAt({
  metId,
  contextType,
  contextId,
}: {
  metId: string;
  contextType: "hangout" | "event";
  contextId: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not signed in" };
  if (metId === user.id)
    return { ok: false as const, error: "Can't tag yourself" };

  // Was already tagged? Toggle off.
  const { data: existing } = await supabase
    .from("met_at")
    .select("reporter_id")
    .eq("reporter_id", user.id)
    .eq("met_id", metId)
    .eq("context_type", contextType)
    .eq("context_id", contextId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("met_at")
      .delete()
      .eq("reporter_id", user.id)
      .eq("met_id", metId)
      .eq("context_type", contextType)
      .eq("context_id", contextId);
    revalidatePath(`/${contextType === "hangout" ? "hangouts" : "trips"}/${contextId}`);
    return { ok: true as const, tagged: false };
  }

  const { error } = await supabase.from("met_at").insert({
    reporter_id: user.id,
    met_id: metId,
    context_type: contextType,
    context_id: contextId,
  });
  if (error) return { ok: false as const, error: error.message };

  revalidatePath(`/${contextType === "hangout" ? "hangouts" : "trips"}/${contextId}`);
  return { ok: true as const, tagged: true };
}
