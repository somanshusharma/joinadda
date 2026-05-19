import { Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { CommunityCard, type CommunityCardData } from "@/components/community/CommunityCard";
import { EmptyState } from "@/components/ui/EmptyState";

type CommunityRow = CommunityCardData & {
  type: "city" | "hometown_in_city" | "interest" | "company";
  city_id: string | null;
  hometown_id: string | null;
};

export default async function CommunitiesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: me } = user
    ? await supabase
        .from("profiles")
        .select("current_city_id, hometown_city_id")
        .eq("id", user.id)
        .single<{
          current_city_id: string | null;
          hometown_city_id: string | null;
        }>()
    : { data: null };

  const { data: communities } = await supabase
    .from("communities")
    .select(
      "id, slug, name, description, icon, member_count, type, city_id, hometown_id",
    )
    .eq("is_active", true)
    .order("member_count", { ascending: false });

  const joinedSet = new Set<string>();
  if (user) {
    const { data: myMemberships } = await supabase
      .from("community_members")
      .select("community_id")
      .eq("profile_id", user.id);
    for (const m of myMemberships ?? []) joinedSet.add(m.community_id);
  }
  const all = (communities as CommunityRow[]) ?? [];

  const mine = all.filter((c) => joinedSet.has(c.id));
  const inCity = all.filter(
    (c) => !joinedSet.has(c.id) && c.city_id === me?.current_city_id,
  );
  const fromHometown = all.filter(
    (c) =>
      !joinedSet.has(c.id) &&
      c.hometown_id &&
      c.hometown_id === me?.hometown_city_id,
  );
  const discover = all.filter(
    (c) =>
      !joinedSet.has(c.id) &&
      c.type === "interest" &&
      c.city_id !== me?.current_city_id,
  );

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold tracking-tight">Communities</h1>
      <p className="mt-1 text-ink-secondary">Find your kind of folks.</p>

      <Section title="Your communities">
        {mine.length === 0 ? (
          <EmptyState
            icon={<Users />}
            title="You haven't joined any yet"
            description="Tap Join on any community below — it's just a vibe check, you can leave anytime."
          />
        ) : (
          <Grid>
            {mine.map((c) => (
              <CommunityCard key={c.id} community={c} joined />
            ))}
          </Grid>
        )}
      </Section>

      {inCity.length > 0 ? (
        <Section title="In your city">
          <Grid>
            {inCity.map((c) => (
              <CommunityCard key={c.id} community={c} joined={false} />
            ))}
          </Grid>
        </Section>
      ) : null}

      {fromHometown.length > 0 ? (
        <Section title="From your hometown">
          <Grid>
            {fromHometown.map((c) => (
              <CommunityCard key={c.id} community={c} joined={false} />
            ))}
          </Grid>
        </Section>
      ) : null}

      {discover.length > 0 ? (
        <Section title="Discover">
          <Grid>
            {discover.map((c) => (
              <CommunityCard key={c.id} community={c} joined={false} />
            ))}
          </Grid>
        </Section>
      ) : null}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <h2 className="mb-3 text-lg font-semibold text-ink">{title}</h2>
      {children}
    </section>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-3 sm:grid-cols-2">{children}</div>;
}
