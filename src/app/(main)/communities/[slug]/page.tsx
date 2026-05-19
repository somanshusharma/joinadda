import Link from "next/link";
import { notFound } from "next/navigation";
import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Users, Sparkles, CalendarDays } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { VibeTag } from "@/components/ui/VibeTag";
import { JoinButton } from "@/components/community/JoinButton";
import { FollowButton } from "@/components/profile/FollowButton";
import { EventCard, type EventCardData } from "@/components/events/EventCard";
import { EVENT_COLUMNS, loadAttendeePreviews } from "@/lib/events";

type Tab = "feed" | "events" | "members";

type CommunityRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  cover_image_url: string | null;
  member_count: number;
  type: string;
};

export default async function CommunityPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { slug } = await params;
  const { tab: rawTab } = await searchParams;
  const tab: Tab =
    rawTab === "events" || rawTab === "members" ? rawTab : "feed";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: community } = await supabase
    .from("communities")
    .select("id, slug, name, description, icon, cover_image_url, member_count, type")
    .eq("slug", slug)
    .maybeSingle<CommunityRow>();

  if (!community) notFound();

  const joined =
    user && (
      await supabase
        .from("community_members")
        .select("profile_id")
        .eq("community_id", community.id)
        .eq("profile_id", user.id)
        .maybeSingle()
    ).data
      ? true
      : false;

  const Icon = ((community.icon && (Icons as unknown as Record<string, LucideIcon>)[community.icon]) ||
    Users) as LucideIcon;

  return (
    <div>
      <div className="h-32 -mx-4 md:-mx-6 rounded-b-3xl bg-gradient-to-br from-primary-200 via-accent-100 to-primary-100" />
      <div className="-mt-10 px-1">
        <div className="flex items-end justify-between gap-3">
          <div className="grid size-20 place-items-center rounded-3xl bg-surface-elevated ring-4 ring-surface text-primary-700">
            <Icon className="size-9" />
          </div>
          {user ? (
            <div className="mb-2">
              <JoinButton communityId={community.id} initialJoined={joined} size="md" />
            </div>
          ) : null}
        </div>

        <h1 className="mt-3 font-display text-2xl font-extrabold tracking-tight">
          {community.name}
        </h1>
        <p className="text-sm text-ink-muted">{community.member_count} members</p>
        {community.description ? (
          <p className="mt-3 text-base leading-relaxed text-ink-secondary">
            {community.description}
          </p>
        ) : null}
      </div>

      <Tabs slug={community.slug} active={tab} />

      <div className="mt-4">
        {tab === "feed" ? (
          <EmptyState
            icon={<Sparkles />}
            title="No posts yet"
            description="When members start chatting, you'll see it here. Posting opens up next sprint."
          />
        ) : tab === "events" ? (
          <CommunityEvents communityId={community.id} />
        ) : (
          <Members communityId={community.id} currentUserId={user?.id ?? null} />
        )}
      </div>
    </div>
  );
}

function Tabs({ slug, active }: { slug: string; active: Tab }) {
  const TABS: { key: Tab; label: string }[] = [
    { key: "feed", label: "Feed" },
    { key: "events", label: "Events" },
    { key: "members", label: "Members" },
  ];
  return (
    <div className="mt-6 flex gap-1 border-b border-surface-border">
      {TABS.map((t) => {
        const isActive = t.key === active;
        return (
          <Link
            key={t.key}
            href={`/communities/${slug}?tab=${t.key}`}
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
  );
}

async function CommunityEvents({ communityId }: { communityId: string }) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("events")
    .select(EVENT_COLUMNS)
    .eq("community_id", communityId)
    .neq("status", "cancelled")
    .order("starts_at", { ascending: true })
    .limit(20);

  const events = (data as unknown as EventCardData[]) ?? [];
  if (events.length === 0) {
    return (
      <EmptyState
        icon={<CalendarDays />}
        title="Nothing planned yet"
        description="Be the first to organize a hangout for this crew."
      />
    );
  }
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

async function Members({
  communityId,
  currentUserId,
}: {
  communityId: string;
  currentUserId: string | null;
}) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("community_members")
    .select(
      "profile:profile_id(id, username, display_name, avatar_url, profession, company, vibe_tags)",
    )
    .eq("community_id", communityId)
    .limit(60);

  const members = (data ?? [])
    .map(
      (r) =>
        r.profile as unknown as {
          id: string;
          username: string;
          display_name: string;
          avatar_url: string | null;
          profession: string | null;
          company: string | null;
          vibe_tags: string[];
        } | null,
    )
    .filter((p): p is NonNullable<typeof p> => p !== null);

  let followingSet = new Set<string>();
  if (currentUserId) {
    const { data: follows } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", currentUserId);
    followingSet = new Set((follows ?? []).map((f) => f.following_id));
  }

  if (members.length === 0) {
    return (
      <EmptyState
        icon={<Users />}
        title="No members yet"
        description="Join up and be the first."
      />
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {members.map((m) => (
        <div
          key={m.id}
          className="rounded-2xl border border-surface-border bg-surface-elevated p-4"
        >
          <div className="flex items-start gap-3">
            <Link href={`/profile/${m.username}`}>
              <Avatar name={m.display_name} src={m.avatar_url} seed={m.id} size="md" />
            </Link>
            <div className="min-w-0 flex-1">
              <Link
                href={`/profile/${m.username}`}
                className="block truncate text-sm font-semibold hover:underline"
              >
                {m.display_name}
              </Link>
              {m.profession ? (
                <p className="truncate text-xs text-ink-muted">
                  {m.profession}
                  {m.company ? ` · ${m.company}` : ""}
                </p>
              ) : null}
            </div>
            {currentUserId && currentUserId !== m.id ? (
              <FollowButton
                targetId={m.id}
                initialFollowing={followingSet.has(m.id)}
                size="sm"
              />
            ) : null}
          </div>
          {m.vibe_tags?.length ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {m.vibe_tags.slice(0, 3).map((v) => (
                <VibeTag key={v} label={v} />
              ))}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
