import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, Home, Pencil, Sparkles, CalendarDays, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { VibeTag } from "@/components/ui/VibeTag";
import { EmptyState } from "@/components/ui/EmptyState";
import { FollowButton } from "@/components/profile/FollowButton";
import { MessageButton } from "@/components/profile/MessageButton";
import { ReviewList } from "@/components/reviews/ReviewList";
import { BlockButton } from "@/components/profile/BlockButton";
import { ReportButton } from "@/components/shared/ReportButton";
import { EventCard, type EventCardData } from "@/components/events/EventCard";
import { EVENT_COLUMNS, loadAttendeePreviews } from "@/lib/events";

type Tab = "posts" | "events" | "communities";

type ProfileRow = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  profession: string | null;
  company: string | null;
  vibe_tags: string[];
  streak_count: number | null;
  last_seen_at: string | null;
  current_city: { name: string } | null;
  hometown: { name: string } | null;
  avg_rating: number | null;
  review_count: number | null;
};

export default async function ProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { username } = await params;
  const { tab: rawTab } = await searchParams;
  const tab: Tab = rawTab === "events" || rawTab === "communities" ? rawTab : "posts";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id, username, display_name, avatar_url, bio, profession, company, vibe_tags, streak_count, last_seen_at, avg_rating, review_count, current_city:current_city_id(name), hometown:hometown_city_id(name)",
    )
    .eq("username", username)
    .maybeSingle<ProfileRow>();

  if (!profile) notFound();

  const isOwner = user?.id === profile.id;

  const [
    { count: followers },
    { count: following },
    { data: amFollowing },
    { data: amBlocking },
    { count: postCount },
  ] = await Promise.all([
    supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", profile.id),
    supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", profile.id),
    user && !isOwner
      ? supabase
          .from("follows")
          .select("follower_id")
          .eq("follower_id", user.id)
          .eq("following_id", profile.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    user && !isOwner
      ? supabase
          .from("blocks")
          .select("blocked_id")
          .eq("blocker_id", user.id)
          .eq("blocked_id", profile.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("posts")
      .select("*", { count: "exact", head: true })
      .eq("author_id", profile.id)
      .eq("is_deleted", false),
  ]);

  // How many distinct people have tagged this profile as "met at" — a real-world social signal.
  const { data: metRows } = await supabase
    .from("met_at")
    .select("reporter_id")
    .eq("met_id", profile.id);
  const metCount = new Set((metRows ?? []).map((r) => r.reporter_id)).size;

  return (
    <div className="-mx-4 md:-mx-6 -mt-4 md:-mt-6 pb-8">
      {/* Cover */}
      <div className="h-32 md:h-40 w-full bg-gradient-to-r from-primary-500 to-peach relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }}
        />
      </div>

      {/* Header section */}
      <section className="px-4 md:px-6">
        <div className="flex items-end justify-between gap-3 -mt-14">
          <div className="rounded-full border-4 border-surface bg-surface-muted">
            <Avatar
              name={profile.display_name}
              src={profile.avatar_url}
              seed={profile.id}
              size="xl"
            />
          </div>
          <div className="mb-2 flex gap-2">
            {isOwner ? (
              <Link href="/profile/edit">
                <Button size="sm" variant="outline">
                  <Pencil className="size-4" /> edit profile
                </Button>
              </Link>
            ) : user ? (
              <>
                <FollowButton
                  targetId={profile.id}
                  initialFollowing={!!amFollowing}
                  size="sm"
                />
                <MessageButton targetId={profile.id} />
              </>
            ) : null}
          </div>
        </div>

        {!isOwner && user ? (
          <div className="mt-2 flex flex-wrap items-center justify-end gap-1">
            <ReportButton entityType="profile" entityId={profile.id} />
            <BlockButton targetId={profile.id} initialBlocked={!!amBlocking} />
          </div>
        ) : null}

        <div className="mt-6">
          <h1 className="font-serif text-3xl md:text-4xl font-semibold tracking-tight text-ink leading-tight">
            {profile.display_name}
          </h1>
          <p className="text-base text-ink-muted">@{profile.username}</p>
        </div>

        {/* Location + hometown */}
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-secondary">
          {profile.current_city ? (
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-4" /> Lives in {profile.current_city.name}
            </span>
          ) : null}
          {profile.hometown ? (
            <span className="inline-flex items-center gap-1">
              <Home className="size-4" /> From {profile.hometown.name}
            </span>
          ) : null}
        </div>

        {/* Profession */}
        {profile.profession ? (
          <p className="mt-3 text-base font-semibold text-primary-700">
            {profile.profession}
            {profile.company ? ` at ${profile.company}` : ""}
          </p>
        ) : null}

        {/* Bio */}
        {profile.bio ? (
          <p className="mt-3 text-base text-ink-secondary leading-relaxed max-w-xl">
            {profile.bio}
          </p>
        ) : null}

        {/* Vibe tags */}
        {profile.vibe_tags?.length ? (
          <div className="mt-5 flex flex-wrap gap-2">
            {profile.vibe_tags.map((v) => (
              <VibeTag key={v} label={v} />
            ))}
          </div>
        ) : null}
      </section>

      {/* Stats row */}
      <section className="mt-6 px-4 md:px-6 py-4 border-y border-surface-border flex flex-wrap gap-x-8 gap-y-3">
        <Stat label="posts" value={postCount ?? 0} />
        <Stat label="followers" value={followers ?? 0} />
        <Stat label="following" value={following ?? 0} />
        {profile.streak_count && profile.streak_count > 1 ? (
          <Stat
            label="day streak 🔥"
            value={profile.streak_count}
            highlight
          />
        ) : null}
        {metCount > 0 ? (
          <Stat label="met IRL" value={metCount} highlight />
        ) : null}
        {profile.review_count && profile.review_count > 0 ? (
          <Stat
            label={`★ ${Number(profile.avg_rating ?? 0).toFixed(1)} rating`}
            value={profile.review_count}
            highlight
          />
        ) : null}
      </section>

      {/* Tabs */}
      <Tabs username={profile.username} active={tab} />

      {/* Tab content */}
      <div className="mt-6 px-4 md:px-6">
        {tab === "posts" ? (
          <ProfilePosts profileId={profile.id} isOwner={isOwner} />
        ) : tab === "events" ? (
          <ProfileEvents profileId={profile.id} isOwner={isOwner} />
        ) : (
          <ProfileCommunities profileId={profile.id} />
        )}
      </div>

      {/* Reviews (vouches) — anyone signed in can leave one (except self) */}
      <div className="mt-8 px-4 md:px-6">
        <ReviewList
          subjectType="profile"
          subjectId={profile.id}
          subjectLabel={profile.display_name}
          avgRating={profile.avg_rating}
          reviewCount={profile.review_count}
          canReview={!isOwner}
        />
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div className="flex flex-col items-start">
      <span
        className={
          "font-display text-2xl font-semibold leading-none " +
          (highlight ? "text-primary-700" : "text-ink")
        }
      >
        {value}
      </span>
      <span className="mt-1 text-sm text-ink-muted">{label}</span>
    </div>
  );
}

function Tabs({ username, active }: { username: string; active: Tab }) {
  const TABS: { key: Tab; label: string }[] = [
    { key: "posts", label: "posts" },
    { key: "events", label: "events" },
    { key: "communities", label: "communities" },
  ];
  return (
    <nav className="mt-6 flex px-4 md:px-6 border-b border-surface-border">
      {TABS.map((t) => {
        const isActive = t.key === active;
        return (
          <Link
            key={t.key}
            href={`/profile/${username}?tab=${t.key}`}
            className={
              "relative px-5 py-3 text-sm font-semibold transition-colors border-b-2 -mb-px " +
              (isActive
                ? "border-primary-500 text-primary-700"
                : "border-transparent text-ink-muted hover:text-ink")
            }
          >
            {t.label}
            {isActive ? (
              <span className="absolute top-2 right-2 size-1.5 bg-primary-500 rounded-full" />
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

async function ProfilePosts({
  profileId,
  isOwner,
}: {
  profileId: string;
  isOwner: boolean;
}) {
  const supabase = await createClient();
  const { data: posts } = await supabase
    .from("posts")
    .select("id, content, created_at")
    .eq("author_id", profileId)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false })
    .limit(10);

  if (!posts || posts.length === 0) {
    return (
      <EmptyState
        icon={<Sparkles />}
        title={isOwner ? "Nothing posted yet" : "Quiet on the posts front"}
        description={
          isOwner
            ? "Share a thought, a meme, or a random Tuesday rant. The feed loves it."
            : "When they post, you'll see it here."
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      {posts.map((p) => (
        <div
          key={p.id}
          className="rounded-2xl border border-surface-border bg-surface-elevated p-5"
        >
          <p className="whitespace-pre-wrap text-base leading-relaxed">{p.content}</p>
        </div>
      ))}
    </div>
  );
}

async function ProfileEvents({
  profileId,
  isOwner,
}: {
  profileId: string;
  isOwner: boolean;
}) {
  const supabase = await createClient();
  const { data: rsvps } = await supabase
    .from("event_rsvps")
    .select("event_id")
    .eq("profile_id", profileId)
    .in("status", ["going", "maybe"]);
  const ids = (rsvps ?? []).map((r) => r.event_id);

  if (ids.length === 0) {
    return (
      <EmptyState
        icon={<CalendarDays />}
        title="No hangouts yet"
        description={
          isOwner
            ? "Trips and hangouts you create or RSVP to show up here."
            : "Nothing scheduled yet. Check back soon."
        }
      />
    );
  }

  const { data } = await supabase
    .from("events")
    .select(EVENT_COLUMNS)
    .in("id", ids)
    .order("starts_at", { ascending: false })
    .limit(20);

  const events = (data as unknown as EventCardData[]) ?? [];
  const attendeesByEvent = await loadAttendeePreviews(
    supabase,
    events.map((e) => e.id),
  );

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {events.map((e) => (
        <EventCard
          key={e.id}
          event={e}
          attendees={attendeesByEvent.get(e.id) ?? []}
        />
      ))}
    </div>
  );
}

async function ProfileCommunities({ profileId }: { profileId: string }) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("community_members")
    .select("community:community_id(id, slug, name, description, icon, member_count)")
    .eq("profile_id", profileId);

  const communities = (data ?? [])
    .map(
      (r) =>
        r.community as unknown as {
          id: string;
          slug: string;
          name: string;
          description: string | null;
          icon: string | null;
          member_count: number;
        } | null,
    )
    .filter((c): c is NonNullable<typeof c> => c !== null);

  if (communities.length === 0) {
    return (
      <EmptyState
        icon={<Users />}
        title="No communities yet"
        description="Join a community to find your people."
      />
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {communities.map((c) => (
        <Link
          key={c.id}
          href={`/communities/${c.slug}`}
          className="rounded-2xl border border-surface-border bg-surface-elevated p-5 hover:border-primary-200"
        >
          <h3 className="font-semibold text-ink">{c.name}</h3>
          <p className="mt-1 text-xs text-ink-muted">{c.member_count} members</p>
          {c.description ? (
            <p className="mt-2 line-clamp-2 text-sm text-ink-secondary">{c.description}</p>
          ) : null}
        </Link>
      ))}
    </div>
  );
}

