import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/ui/Avatar";
import { JoinHangoutButton } from "@/components/hangouts/JoinHangoutButton";
import { SignUpCta } from "@/components/shared/SignUpCta";
import {
  MetAtPanel,
  type MetCandidate,
} from "@/components/hangouts/MetAtPanel";
import { timeAgo } from "@/lib/utils";

type HangoutDetailRow = {
  id: string;
  activity: string;
  description: string | null;
  time_window: string;
  starts_at: string | null;
  location: string;
  max_joiners: number;
  joiner_count: number;
  status: "open" | "full" | "happening" | "completed" | "cancelled";
  host_id: string;
  conversation_id: string | null;
  created_at: string;
  host: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
    profession: string | null;
  } | null;
  city: { name: string } | null;
};

export default async function HangoutDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: hangout } = await supabase
    .from("hangouts")
    .select(
      "id, activity, description, time_window, starts_at, location, max_joiners, joiner_count, status, host_id, conversation_id, created_at, host:host_id(id, username, display_name, avatar_url, profession), city:city_id(name)",
    )
    .eq("id", id)
    .maybeSingle<HangoutDetailRow>();

  if (!hangout) notFound();

  const [joinerRowsRes, myJoinRes] = await Promise.all([
    supabase
      .from("hangout_joiners")
      .select(
        "profile:profile_id(id, username, display_name, avatar_url)",
      )
      .eq("hangout_id", id)
      .eq("status", "going"),
    user
      ? supabase
          .from("hangout_joiners")
          .select("status")
          .eq("hangout_id", id)
          .eq("profile_id", user.id)
          .maybeSingle<{ status: string }>()
      : Promise.resolve({ data: null }),
  ]);
  const joinerRows = joinerRowsRes.data;
  const myJoin = myJoinRes.data;

  type JoinerRow = {
    profile: {
      id: string;
      username: string;
      display_name: string;
      avatar_url: string | null;
    } | null;
  };
  const allJoiners = ((joinerRows as unknown as JoinerRow[]) ?? [])
    .map((j) => j.profile)
    .filter((p): p is NonNullable<JoinerRow["profile"]> => p !== null);

  const isJoined = myJoin?.status === "going";
  const isHost = !!user && hangout.host_id === user.id;
  const isFull = hangout.joiner_count >= hangout.max_joiners;
  const isCancelled = hangout.status === "cancelled";
  const slotsLeft = Math.max(0, hangout.max_joiners - hangout.joiner_count);

  // "How did it go?" panel — for attendees, after the start time has passed.
  const startMs = hangout.starts_at
    ? new Date(hangout.starts_at).getTime()
    : new Date(hangout.created_at).getTime();
  const showMetPanel =
    !!user && (isJoined || isHost) && !isCancelled && startMs < Date.now();
  let metCandidates: MetCandidate[] = [];
  let initialTagged: string[] = [];
  if (showMetPanel && user) {
    metCandidates = allJoiners
      .filter((j) => j.id !== user.id)
      .map((j) => ({
        id: j.id,
        username: j.username,
        display_name: j.display_name,
        avatar_url: j.avatar_url,
      }));
    const { data: myTags } = await supabase
      .from("met_at")
      .select("met_id")
      .eq("reporter_id", user.id)
      .eq("context_type", "hangout")
      .eq("context_id", hangout.id);
    initialTagged = (myTags ?? []).map((t) => t.met_id);
  }

  const whenLabel = formatWhen(hangout.time_window, hangout.starts_at);
  const fullLocation =
    hangout.city ? `${hangout.location}, ${hangout.city.name}` : hangout.location;
  const mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullLocation)}`;

  return (
    <div className="max-w-3xl relative">
      {/* Back link */}
      <Link
        href="/hangouts"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-muted hover:text-primary-600 mb-6 group transition-colors"
      >
        <span className="material-symbols-outlined text-[20px] group-hover:-translate-x-0.5 transition-transform">
          arrow_back
        </span>
        back to hangouts
      </Link>

      {/* Hero card */}
      <article className="bg-white rounded-[32px] p-6 md:p-10 sun-kissed-shadow mb-12">
        {/* Host header */}
        {hangout.host ? (
          <Link
            href={`/profile/${hangout.host.username}`}
            className="flex items-center gap-4 mb-8 group"
          >
            <div className="rounded-full border-2 border-peach">
              <Avatar
                name={hangout.host.display_name}
                src={hangout.host.avatar_url}
                seed={hangout.host.id}
                size="lg"
              />
            </div>
            <div>
              <h3 className="font-display text-xl font-semibold leading-none mb-1 group-hover:text-primary-600 transition-colors">
                {hangout.host.display_name}
              </h3>
              <p className="text-sm text-ink-muted">
                hosting · {timeAgo(hangout.created_at)}
              </p>
            </div>
          </Link>
        ) : null}

        {/* Activity + description */}
        <div className="mb-10">
          <h2 className="font-serif text-3xl md:text-4xl font-semibold text-primary-700 mb-4 leading-tight lowercase">
            {hangout.activity}
          </h2>
          {hangout.description ? (
            <p className="text-base md:text-lg text-ink-secondary leading-relaxed">
              {hangout.description}
            </p>
          ) : null}
        </div>

        {/* Fact grid (3 cards) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 py-7 border-y border-surface-border mb-10">
          <Fact tint="sky" icon="schedule" label="When">
            {whenLabel}
          </Fact>
          <Fact tint="lilac" icon="location_on" label="Where">
            {fullLocation}
          </Fact>
          <Fact tint="peach" icon="group" label="Crew">
            {isCancelled
              ? "Cancelled"
              : isFull
                ? `Full · ${hangout.joiner_count} of ${hangout.max_joiners}`
                : `${hangout.joiner_count} of ${hangout.max_joiners} · ${slotsLeft} slot${
                    slotsLeft === 1 ? "" : "s"
                  } left`}
          </Fact>
        </div>

        {/* Map / directions */}
        <a
          href={mapsHref}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full h-40 bg-surface-muted rounded-2xl mb-10 overflow-hidden relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-peach via-mango-300/60 to-primary-100" />
          <div className="absolute inset-0 grid place-items-center">
            <div className="bg-white px-4 py-2 rounded-full sun-kissed-shadow inline-flex items-center gap-2 group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-primary-600">
                near_me
              </span>
              <span className="text-sm font-semibold text-ink">
                Get directions
              </span>
            </div>
          </div>
        </a>

        {/* CTA row */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            {user ? (
              <JoinHangoutButton
                hangoutId={hangout.id}
                initialJoined={isJoined}
                isFull={isFull}
                isHost={isHost}
                isCancelled={isCancelled}
                size="lg"
              />
            ) : (
              <SignUpCta
                label="Sign up to join"
                size="lg"
                next={`/hangouts/${hangout.id}`}
              />
            )}
          </div>
          {(isJoined || isHost) && hangout.conversation_id ? (
            <Link
              href={`/chat/${hangout.conversation_id}`}
              className="flex-1 inline-flex items-center justify-center gap-2 border-2 border-surface-border text-ink-secondary font-semibold h-12 rounded-full hover:bg-surface-muted active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[20px]">
                chat_bubble
              </span>
              Open group chat
            </Link>
          ) : null}
        </div>
      </article>

      {/* Going */}
      <section>
        <h4 className="font-display text-xl font-semibold mb-6 flex items-baseline gap-2">
          going{" "}
          <span className="text-ink-muted font-normal text-base">
            ({hangout.joiner_count})
          </span>
        </h4>
        {allJoiners.length === 0 ? (
          <p className="text-sm text-ink-muted">
            Nobody&apos;s in yet. Be the first to RSVP.
          </p>
        ) : (
          <div className="flex flex-wrap gap-6 md:gap-8">
            {allJoiners.map((p) => {
              const isPersonHost = p.id === hangout.host_id;
              return (
                <Link
                  key={p.id}
                  href={`/profile/${p.username}`}
                  className="flex flex-col items-center gap-2 group"
                >
                  <div className="relative">
                    <div className="rounded-full border-4 border-white sun-kissed-shadow group-hover:scale-105 transition-transform">
                      <Avatar
                        name={p.display_name}
                        src={p.avatar_url}
                        seed={p.id}
                        size="lg"
                      />
                    </div>
                    {isPersonHost ? (
                      <div className="absolute -top-1 -right-1 bg-primary-500 text-white p-1 rounded-full border-2 border-white grid place-items-center">
                        <span
                          className="material-symbols-outlined text-[12px]"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          star
                        </span>
                      </div>
                    ) : null}
                  </div>
                  <span className="text-sm font-medium text-ink">
                    {p.display_name.split(" ")[0]}
                  </span>
                </Link>
              );
            })}

            {/* "invite" placeholder for empty slots */}
            {slotsLeft > 0 && !isCancelled ? (
              <div className="flex flex-col items-center gap-2 opacity-50">
                <div className="w-[72px] h-[72px] rounded-full border-2 border-dashed border-surface-border grid place-items-center">
                  <span className="material-symbols-outlined text-2xl text-ink-muted">
                    add
                  </span>
                </div>
                <span className="text-sm font-medium text-ink-muted">
                  invite
                </span>
              </div>
            ) : null}
          </div>
        )}
      </section>

      {/* "How did it go?" — after the start time, for attendees */}
      {showMetPanel ? (
        <section className="mt-8">
          <MetAtPanel
            contextType="hangout"
            contextId={hangout.id}
            candidates={metCandidates}
            initialTagged={initialTagged}
          />
        </section>
      ) : null}

      {/* Decorative handwritten sticker (desktop only) */}
      {!isCancelled && !isFull ? (
        <div className="hidden xl:block fixed bottom-12 right-12 rotate-12 z-30 pointer-events-none">
          <div className="bg-peach px-6 py-2 rounded-xl shadow-sm border border-primary-200/40">
            <span className="font-sticker text-lg text-primary-700">
              join the vibe!
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function formatWhen(timeWindow: string, startsAt: string | null) {
  if (startsAt) {
    const d = new Date(startsAt);
    return d.toLocaleDateString(undefined, {
      weekday: "long",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }
  return timeWindow;
}

function Fact({
  tint,
  icon,
  label,
  children,
}: {
  tint: "sky" | "lilac" | "peach";
  icon: string;
  label: string;
  children: React.ReactNode;
}) {
  const bg = tint === "sky" ? "bg-sky" : tint === "lilac" ? "bg-lilac" : "bg-peach";
  return (
    <div className="flex items-start gap-4">
      <div className={`p-3 ${bg} rounded-2xl shrink-0`}>
        <span className="material-symbols-outlined text-primary-700">
          {icon}
        </span>
      </div>
      <div className="min-w-0">
        <p className="text-xs text-ink-muted mb-1">{label}</p>
        <p className="text-base font-semibold text-ink leading-snug">
          {children}
        </p>
      </div>
    </div>
  );
}
