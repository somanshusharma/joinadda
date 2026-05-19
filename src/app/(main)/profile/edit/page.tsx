import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { City, Profile } from "@/lib/types";
import { EditProfileForm } from "./EditProfileForm";

export default async function EditProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: cities }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single<Profile>(),
    supabase.from("cities").select("*").order("display_order"),
  ]);

  if (!profile) redirect("/onboarding");

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold tracking-tight">
        Edit your profile
      </h1>
      <p className="mt-1 text-ink-secondary">Keep it real, keep it you.</p>
      <div className="mt-6">
        <EditProfileForm profile={profile} cities={(cities as City[]) ?? []} />
      </div>
    </div>
  );
}
