import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { City } from "@/lib/types";
import { CreateEventForm } from "./CreateEventForm";

export default async function CreateEventPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: cities }, { data: profile }, { data: memberships }] = await Promise.all([
    supabase.from("cities").select("*").order("display_order"),
    supabase
      .from("profiles")
      .select("current_city_id")
      .eq("id", user.id)
      .single<{ current_city_id: string | null }>(),
    supabase
      .from("community_members")
      .select("community:community_id(id, name)")
      .eq("profile_id", user.id),
  ]);

  const communities = ((memberships ?? []) as unknown as { community: { id: string; name: string } | null }[])
    .map((r) => r.community)
    .filter((c): c is { id: string; name: string } => c !== null);

  return (
    <div className="pb-4">
      <h1 className="font-display text-2xl font-extrabold tracking-tight">
        Make a plan
      </h1>
      <p className="mt-1 text-ink-secondary">
        A trip, a chai meetup, a Friday plan — drop it here.
      </p>
      <div className="mt-6">
        <CreateEventForm
          cities={(cities as City[]) ?? []}
          defaultCityId={profile?.current_city_id ?? null}
          communities={communities}
        />
      </div>
    </div>
  );
}
