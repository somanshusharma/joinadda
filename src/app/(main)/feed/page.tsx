import { Suspense } from "react";
import Link from "next/link";
import { CalendarDays, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/EmptyState";
import { PostCard } from "@/components/feed/PostCard";
import { POST_COLUMNS, hydratePosts, type RawPost } from "@/lib/feed";
import { EventCard, type EventCardData } from "@/components/events/EventCard";
import { EVENT_COLUMNS } from "@/lib/events";
import { loadBlockedIds } from "@/lib/blocks";
import { RightRail } from "@/components/feed/RightRail";
import { Skeleton } from "@/components/shared/Skeleton";

type FeedTab = "foryou" | "following" | "city" | "trips";

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab: rawTab } = await searchParams;
  const tab: FeedTab =
    rawTab === "following" || rawTab === "city" || rawTab === "trips"
      ? (rawTab as FeedTab)
      : "foryou";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Authed users get their personal lookups; guests get empty defaults.
  const [meRes, followsRes, membershipsRes, blocked] = user
    ? await Promise.all([
        supabase
          .from("profiles")
          .select(
            "display_name, current_city_id, current_city:current_city_id(name)",
          )
          .eq("id", user.id)
          .single<{
            display_name: string;
            current_city_id: string | null;
            current_city: { name: string } | null;
          }>(),
        supabase
          .from("follows")
          .select("following_id")
          .eq("follower_id", user.id),
        supabase
          .from("community_members")
          .select("community_id")
          .eq("profile_id", user.id),
        loadBlockedIds(supabase, user.id),
      ])
    : [
        { data: null },
        { data: null },
        { data: null },
        new Set<string>(),
      ];

  const me = meRes.data;
  const cityName = me?.current_city?.name ?? "your city";
  const followingIds = (followsRes.data ?? []).map((f) => f.following_id);
  const membershipIds = (membershipsRes.data ?? []).map((m) => m.community_id);

  // Posts query depends on the tab
  let posts: RawPost[] = [];
  if (tab === "following" && followingIds.length > 0) {
    const { data } = await supabase
      .from("posts")
      .select(POST_COLUMNS)
      .in("author_id", followingIds)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false })
      .limit(30);
    posts = (data as unknown as RawPost[]) ?? [];
  } else if (tab === "city" && me?.current_city_id) {
    const { data: cityCommunities } = await supabase
      .from("communities")
      .select("id")
      .eq("city_id", me.current_city_id);
    const commIds = (cityCommunities ?? []).map((c) => c.id);
    if (commIds.length > 0) {
      const { data } = await supabase
        .from("posts")
        .select(POST_COLUMNS)
        .in("community_id", commIds)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false })
        .limit(30);
      posts = (data as unknown as RawPost[]) ?? [];
    }
  } else if (tab === "foryou") {
    // Authed: posts from people I follow + communities I'm in (+ my own).
    // Guest: just the latest 30 posts in the system.
    if (user) {
      const authorIds = [user.id, ...followingIds];
      const filters: string[] = [];
      if (authorIds.length > 0)
        filters.push(`author_id.in.(${authorIds.join(",")})`);
      if (membershipIds.length > 0)
        filters.push(`community_id.in.(${membershipIds.join(",")})`);
      if (filters.length > 0) {
        const { data } = await supabase
          .from("posts")
          .select(POST_COLUMNS)
          .or(filters.join(","))
          .eq("is_deleted", false)
          .order("created_at", { ascending: false })
          .limit(30);
        posts = (data as unknown as RawPost[]) ?? [];
      }
    } else {
      const { data } = await supabase
        .from("posts")
        .select(POST_COLUMNS)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false })
        .limit(30);
      posts = (data as unknown as RawPost[]) ?? [];
    }
  }

  const visiblePosts = posts.filter((p) => !blocked.has(p.author?.id ?? ""));
  const hydrated =
    tab === "trips" ? [] : await hydratePosts(supabase, visiblePosts, user?.id ?? null);

  const firstName = (me?.display_name ?? "friend").split(" ")[0];

  return (
    <div className="flex gap-6">
      <div className="flex-1 min-w-0">
        <div className="mb-6">
          <h2 className="text-3xl font-semibold tracking-tight text-ink">
            Welcome back, {firstName}.
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            Banter, not boasting. Relax and catch up.
          </p>
        </div>

        <div className="mb-4 flex gap-6 overflow-x-auto whitespace-nowrap border-b border-surface-border">
          {[
            { key: "foryou", label: "For You" },
            { key: "following", label: "Following" },
            { key: "city", label: `${cityName} Hangouts` },
            { key: "trips", label: "Getaways" },
          ].map((t) => {
            const isActive = t.key === tab;
            return (
              <Link
                key={t.key}
                href={`/feed?tab=${t.key}`}
                prefetch
                className={
                  "pb-3 text-sm font-semibold transition border-b-2 -mb-px " +
                  (isActive
                    ? "border-primary-500 text-primary-700"
                    : "border-transparent text-ink-secondary hover:text-ink")
                }
              >
                {t.label}
              </Link>
            );
          })}
        </div>

        {tab === "trips" ? (
          <Suspense fallback={<TripsSkeleton />}>
            <TripsTab cityId={me?.current_city_id ?? null} />
          </Suspense>
        ) : (
          <div className="mt-4 space-y-4">
            {hydrated.length === 0 ? (
              <EmptyState
                icon={<Sparkles />}
                title="Quiet here right now."
                description={
                  tab === "following"
                    ? "Follow some folks and their posts will show up here."
                    : "Join a community or follow people — and drop your own first post with the + button."
                }
              />
            ) : (
              hydrated.map((p) => <PostCard key={p.id} post={p} />)
            )}
          </div>
        )}
      </div>

      {user ? (
        <Suspense fallback={<RightRailSkeleton />}>
          <RightRail currentUserId={user.id} cityId={me?.current_city_id ?? null} />
        </Suspense>
      ) : null}
    </div>
  );
}

async function TripsTab({ cityId }: { cityId: string | null }) {
  const supabase = await createClient();
  let q = supabase
    .from("events")
    .select(EVENT_COLUMNS)
    .neq("status", "cancelled")
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true })
    .limit(30);
  if (cityId) q = q.eq("city_id", cityId);
  const { data } = await q;
  const events = (data as unknown as EventCardData[]) ?? [];
  if (events.length === 0) {
    return (
      <div className="mt-5">
        <EmptyState
          icon={<CalendarDays />}
          title="Nothing planned yet."
          description="Be the first to drop a weekend plan."
        />
      </div>
    );
  }
  return (
    <div className="mt-5 grid gap-4 sm:grid-cols-2">
      {events.map((e) => (
        <EventCard key={e.id} event={e} />
      ))}
    </div>
  );
}

function TripsSkeleton() {
  return (
    <div className="mt-5 grid gap-4 sm:grid-cols-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-80" />
      ))}
    </div>
  );
}

function RightRailSkeleton() {
  return (
    <aside className="hidden xl:flex flex-col gap-4 w-80 shrink-0 sticky top-20 self-start py-4">
      <Skeleton className="h-64" />
      <Skeleton className="h-64" />
    </aside>
  );
}
