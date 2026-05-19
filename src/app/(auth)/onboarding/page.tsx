import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { suggestUsername } from "@/lib/utils";
import { OnboardingFlow } from "./OnboardingFlow";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_onboarded")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.is_onboarded) redirect("/");

  const { data: cities } = await supabase
    .from("cities")
    .select("id, name, slug, state, display_order")
    .order("display_order", { ascending: true });

  const initialUsername = suggestUsername(user.email ?? "");

  return (
    <OnboardingFlow
      cities={cities ?? []}
      initialUsername={initialUsername}
    />
  );
}
