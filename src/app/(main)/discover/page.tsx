import Link from "next/link";
import { Users, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/EmptyState";
import { UserCard, type UserCardProfile } from "@/components/shared/UserCard";
import { CommunityCard, type CommunityCardData } from "@/components/community/CommunityCard";
import { loadBlockedIds } from "@/lib/blocks";

type DiscoverTab = "people" | "communities";

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; filter?: string }>;
}) {
  const { tab: rawTab, filter: rawFilter } = await searchParams;
  const tab: DiscoverTab = rawTab === "communities" ? "communities" : "people";
  const filter = rawFilter ?? "city";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: me } = user
    ? await supabase
        .from("profiles")
        .select("current_city_id, hometown_city_id, vibe_tags")
        .eq("id", user.id)
        .single<{
          current_city_id: string | null;
          hometown_city_id: string | null;
          vibe_tags: string[];
        }>()
    : { data: null };

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold tracking-tight">Discover</h1>
      <p className="mt-1 text-ink-secondary">
        Find people from your hometown, your city, or your vibe.
      </p>

      <div className="mt-5 flex gap-1 border-b border-surface-border">
        {[
          { key: "people", label: "People" },
          { key: "communities", label: "Communities" },
        ].map((t) => {
          const isActive = t.key === tab;
          return (
            <Link
              key={t.key}
              href={`/discover?tab=${t.key}`}
              className={
                "px-4 py-2.5 text-sm font-semibold transition border-b-2 -mb-px " +
                (isActive
                  ? "border-primary-500 text-primary-700"
                  : "border-transparent text-ink-muted hover:text-ink")
              }
            >
              {t.label}
            </Link>
          );
        })}
      </div>

      <div className="mt-5">
        {tab === "people" ? (
          <People
            currentUserId={user?.id ?? null}
            filter={filter}
            cityId={me?.current_city_id ?? null}
            hometownId={me?.hometown_city_id ?? null}
            vibes={me?.vibe_tags ?? []}
          />
        ) : (
          <Communities currentUserId={user?.id ?? null} cityId={me?.current_city_id ?? null} />
        )}
      </div>
    </div>
  );
}

async function People({
  currentUserId,
  filter,
  cityId,
  hometownId,
  vibes,
}: {
  currentUserId: string | null;
  filter: string;
  cityId: string | null;
  hometownId: string | null;
  vibes: string[];
}) {
  const supabase = await createClient();

  let query = supabase
    .from("profiles")
    .select(
      "id, username, display_name, avatar_url, profession, company, vibe_tags, current_city_id, hometown_city_id",
    )
    .eq("is_onboarded", true)
    .limit(40);
  if (currentUserId) query = query.neq("id", currentUserId);

  if (filter === "hometown" && hometownId) {
    query = query.eq("hometown_city_id", hometownId);
  } else if (filter === "vibe" && vibes.length > 0) {
    query = query.overlaps("vibe_tags", vibes);
  } else if (cityId) {
    query = query.eq("current_city_id", cityId);
  }

  const { data } = await query;
  const blocked = currentUserId
    ? await loadBlockedIds(supabase, currentUserId)
    : new Set<string>();
  const people = ((data as UserCardProfile[]) ?? []).filter((p) => !blocked.has(p.id));

  const followingSet = new Set<string>();
  if (currentUserId) {
    const { data: follows } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", currentUserId);
    for (const f of follows ?? []) followingSet.add(f.following_id);
  }

  return (
    <div>
      <div className="mb-4 flex gap-2 overflow-x-auto">
        {[
          { key: "city", label: "Same city" },
          { key: "hometown", label: "From your hometown" },
          { key: "vibe", label: "Similar vibes" },
        ].map((f) => {
          const isActive = filter === f.key;
          return (
            <Link
              key={f.key}
              href={`/discover?tab=people&filter=${f.key}`}
              className={
                "whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-semibold transition " +
                (isActive
                  ? "border-primary-500 bg-primary-500 text-white"
                  : "border-surface-border bg-surface-elevated text-ink-secondary hover:border-primary-200")
              }
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      {people.length === 0 ? (
        <EmptyState
          icon={<Sparkles />}
          title="Nobody here yet"
          description="Adda is just starting out in your city. Invite a friend?"
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {people.map((p) => (
            <UserCard
              key={p.id}
              profile={p}
              currentUserId={currentUserId}
              isFollowing={followingSet.has(p.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

async function Communities({
  currentUserId,
  cityId,
}: {
  currentUserId: string | null;
  cityId: string | null;
}) {
  const supabase = await createClient();
  let query = supabase
    .from("communities")
    .select("id, slug, name, description, icon, member_count")
    .eq("is_active", true)
    .order("member_count", { ascending: false })
    .limit(30);
  if (cityId) query = query.or(`city_id.eq.${cityId},city_id.is.null`);
  const { data } = await query;
  const communities = (data as CommunityCardData[]) ?? [];

  const joinedSet = new Set<string>();
  if (currentUserId) {
    const { data: myMemberships } = await supabase
      .from("community_members")
      .select("community_id")
      .eq("profile_id", currentUserId);
    for (const m of myMemberships ?? []) joinedSet.add(m.community_id);
  }

  if (communities.length === 0) {
    return (
      <EmptyState
        icon={<Users />}
        title="No communities yet"
        description="Hang tight — more are coming as Adda grows."
      />
    );
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {communities.map((c) => (
        <CommunityCard key={c.id} community={c} joined={joinedSet.has(c.id)} />
      ))}
    </div>
  );
}
