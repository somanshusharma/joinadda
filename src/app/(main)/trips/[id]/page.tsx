import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/ui/Avatar";
import { RSVPButton } from "@/components/events/RSVPButton";
import { OpenEventChatButton } from "@/components/events/OpenEventChatButton";
import { SignUpCta } from "@/components/shared/SignUpCta";
import { TripExpensesPanel } from "@/components/trips/TripExpensesPanel";
import type { AttendeePreview } from "@/components/events/AttendeeStack";
import type { RsvpStatus } from "@/lib/types";

type EventDetailRow = {
  id: string;
  title: string;
  description: string;
  cover_image_url: string | null;
  type: "trip" | "workcation" | "hangout" | "community_event";
  location: string;
  starts_at: string;
  ends_at: string | null;
  cost_per_person_inr: number;
  cost_notes: string | null;
  max_attendees: number | null;
  attendee_count: number;
  status: "open" | "full" | "cancelled" | "completed";
  organizer_id: string;
  organizer: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
    profession: string | null;
  } | null;
  city: { name: string } | null;
  community: { slug: string; name: string } | null;
};

const TYPE_LABEL = {
  trip: "trip",
  workcation: "workcation",
  hangout: "hangout",
  community_event: "meetup",
} as const;

const TYPE_GRADIENT = {
  trip: "from-emerald-200 via-accent-100 to-primary-100",
  workcation: "from-sky via-mango-300/40 to-primary-100",
  hangout: "from-peach via-accent-100 to-primary-100",
  community_event: "from-lilac via-accent-100 to-primary-100",
} as const;

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: event } = await supabase
    .from("events")
    .select(
      "id, title, description, cover_image_url, type, location, starts_at, ends_at, cost_per_person_inr, cost_notes, max_attendees, attendee_count, status, organizer_id, organizer:organizer_id(id, username, display_name, avatar_url, profession), city:city_id(name), community:community_id(slug, name)",
    )
    .eq("id", id)
    .maybeSingle<EventDetailRow>();

  if (!event) notFound();

  const { data: rsvpRows } = await supabase
    .from("event_rsvps")
    .select(
      "status, profile:profile_id(id, username, display_name, avatar_url)",
    )
    .eq("event_id", id)
    .eq("status", "going")
    .limit(40);

  type RsvpRow = { status: string; profile: AttendeePreview | null };
  const attendees = ((rsvpRows as unknown as RsvpRow[]) ?? [])
    .map((r) => r.profile)
    .filter((p): p is AttendeePreview => p !== null);

  let myStatus: RsvpStatus | null = null;
  if (user) {
    const { data: mine } = await supabase
      .from("event_rsvps")
      .select("status")
      .eq("event_id", id)
      .eq("profile_id", user.id)
      .maybeSingle<{ status: RsvpStatus }>();
    myStatus = mine?.status ?? null;
  }

  const isOrganizer = user?.id === event.organizer_id;
  const isAttendee =
    isOrganizer || (!!user && myStatus === "going");
  const isFull =
    event.max_attendees !== null && event.attendee_count >= event.max_attendees;
  const isCancelled = event.status === "cancelled";
  const spotsLeft =
    event.max_attendees !== null
      ? Math.max(0, event.max_attendees - event.attendee_count)
      : null;

  const starts = new Date(event.starts_at);
  const ends = event.ends_at ? new Date(event.ends_at) : null;
  const isFree = event.cost_per_person_inr <= 0;

  return (
    <div className="-mx-4 md:-mx-6 -mt-4 md:-mt-6 pb-32 md:pb-12">
      {/* Hero image */}
      <section className="relative h-64 md:h-80 w-full">
        <div className="absolute inset-0 overflow-hidden rounded-b-3xl bg-surface-muted">
          {event.cover_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={event.cover_image_url}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className={`w-full h-full bg-gradient-to-br ${TYPE_GRADIENT[event.type]}`}
            />
          )}
        </div>

        {/* Back link, type pill, status pill */}
        <div className="absolute inset-0 px-4 md:px-6 flex justify-between items-start pt-4">
          <Link
            href="/trips"
            className="inline-flex items-center gap-1.5 bg-white/85 backdrop-blur-md text-ink-secondary text-sm font-semibold px-4 py-2 rounded-full hover:bg-white transition-colors group"
          >
            <span className="material-symbols-outlined text-[18px] group-hover:-translate-x-0.5 transition-transform">
              arrow_back
            </span>
            back
          </Link>
          <div className="flex flex-col items-end gap-2">
            <span className="px-3 py-1 bg-white/30 backdrop-blur-md border border-white/30 rounded-full text-[11px] font-bold tracking-widest uppercase text-white">
              {TYPE_LABEL[event.type]}
            </span>
            {isCancelled ? (
              <span className="px-3 py-1 bg-danger text-white rounded-full text-xs font-bold sun-kissed-shadow">
                Cancelled
              </span>
            ) : isFull ? (
              <span className="px-3 py-1 bg-ink/85 text-white rounded-full text-xs font-bold">
                Full
              </span>
            ) : spotsLeft !== null && spotsLeft <= 5 ? (
              <span className="px-3 py-1 bg-mango-400 text-mango-700 rounded-full text-xs font-bold sun-kissed-shadow">
                {spotsLeft} spot{spotsLeft === 1 ? "" : "s"} left
              </span>
            ) : null}
          </div>
        </div>
      </section>

      {/* Title card — overlaps hero on mobile */}
      <section className="px-4 md:px-6 -mt-8 relative z-10">
        <div className="bg-white p-6 rounded-3xl sun-kissed-shadow border border-white">
          <h2 className="font-serif text-2xl md:text-4xl font-semibold text-ink leading-tight tracking-tight lowercase">
            {event.title}
          </h2>
          {event.community ? (
            <p className="mt-2 text-sm text-ink-secondary">
              in{" "}
              <Link
                href={`/communities/${event.community.slug}`}
                className="text-primary-600 font-semibold hover:underline"
              >
                {event.community.name}
              </Link>
            </p>
          ) : null}

          {/* Organizer */}
          {event.organizer ? (
            <Link
              href={`/profile/${event.organizer.username}`}
              className="mt-6 p-4 bg-surface-muted rounded-2xl flex items-center justify-between gap-3 group hover:bg-surface-low transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="rounded-full border-2 border-white shadow-sm">
                  <Avatar
                    name={event.organizer.display_name}
                    src={event.organizer.avatar_url}
                    seed={event.organizer.id}
                    size="md"
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-wider text-ink-muted font-semibold">
                    Organized by
                  </p>
                  <p className="font-display text-base font-semibold text-ink leading-none mt-0.5">
                    {event.organizer.display_name}
                  </p>
                  {event.organizer.profession ? (
                    <p className="text-xs text-ink-muted mt-0.5 truncate">
                      {event.organizer.profession}
                    </p>
                  ) : null}
                </div>
              </div>
              <span className="hidden sm:inline-flex text-xs font-bold text-primary-700 px-3 py-1.5 rounded-full bg-white border border-surface-border group-hover:border-primary-300 transition-colors">
                view profile
              </span>
            </Link>
          ) : null}
        </div>
      </section>

      {/* Facts grid */}
      <section className="mt-6 px-4 md:px-6 grid grid-cols-2 md:grid-cols-4 gap-3">
        <FactCard icon="calendar_today" label="When">
          {starts.toLocaleDateString(undefined, {
            weekday: "short",
            month: "short",
            day: "numeric",
          })}
          {" · "}
          {starts.toLocaleTimeString(undefined, {
            hour: "numeric",
            minute: "2-digit",
          })}
          {ends ? (
            <>
              <br />→{" "}
              {ends.toLocaleTimeString(undefined, {
                hour: "numeric",
                minute: "2-digit",
              })}
            </>
          ) : null}
        </FactCard>
        <FactCard icon="location_on" label="Where">
          {event.location}
          {event.city ? `, ${event.city.name}` : ""}
        </FactCard>
        <FactCard icon="groups" label="Crew">
          {event.attendee_count} going
          {event.max_attendees ? ` of ${event.max_attendees}` : ""}
        </FactCard>
        <FactCard icon="payments" label="Cost">
          {isFree
            ? "Free"
            : `₹${event.cost_per_person_inr.toLocaleString("en-IN")} / person`}
        </FactCard>
      </section>

      {/* The plan */}
      <section className="mt-8 px-4 md:px-6">
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-surface-border sun-kissed-shadow relative overflow-hidden">
          <div className="absolute -top-1 -right-2 rotate-12 pointer-events-none">
            <span className="font-sticker text-base text-primary-700 bg-peach/70 px-3 py-1 rounded-lg">
              {event.type === "trip" ? "don't forget chai!" : "be on time!"}
            </span>
          </div>
          <h3 className="font-display text-2xl font-semibold text-ink mb-4 flex items-center gap-2 lowercase">
            <span className="material-symbols-outlined text-primary-600">
              auto_awesome
            </span>
            the plan
          </h3>
          <p className="whitespace-pre-wrap text-base text-ink-secondary leading-relaxed">
            {event.description}
          </p>
          {event.cost_notes ? (
            <p className="mt-4 text-sm text-ink-muted italic">
              💰 {event.cost_notes}
            </p>
          ) : null}
        </div>
      </section>

      {/* Trip expenses — Splitwise-style bill splitter */}
      <section className="mt-8 px-4 md:px-6">
        <TripExpensesPanel
          eventId={event.id}
          currentUserId={user?.id ?? null}
          isAttendee={isAttendee}
          members={attendees}
        />
      </section>

      {/* Going */}
      <section className="mt-8 px-4 md:px-6">
        <div className="flex items-baseline justify-between mb-4">
          <h3 className="font-display text-2xl font-semibold lowercase">
            going{" "}
            <span className="text-ink-muted font-normal text-base">
              ({event.attendee_count})
            </span>
          </h3>
        </div>
        {attendees.length === 0 ? (
          <p className="text-sm text-ink-muted">
            Nobody&apos;s in yet. Be the first.
          </p>
        ) : (
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-y-5 gap-x-2">
            {attendees.slice(0, 16).map((a) => (
              <Link
                key={a.id}
                href={`/profile/${a.username}`}
                className="flex flex-col items-center gap-2 group"
              >
                <div className="ring-2 ring-white rounded-full sun-kissed-shadow group-hover:scale-110 transition-transform">
                  <Avatar
                    name={a.display_name}
                    src={a.avatar_url}
                    seed={a.id}
                    size="lg"
                  />
                </div>
                <span className="text-xs text-ink-secondary line-clamp-1 text-center">
                  {a.display_name.split(" ")[0]}
                </span>
              </Link>
            ))}
            {attendees.length > 16 ? (
              <div className="flex flex-col items-center gap-2">
                <div className="size-14 rounded-full ring-2 ring-white bg-surface-muted grid place-items-center sun-kissed-shadow">
                  <span className="text-sm font-bold text-ink-secondary">
                    +{attendees.length - 16}
                  </span>
                </div>
                <span className="text-xs text-ink-muted">others</span>
              </div>
            ) : null}
          </div>
        )}
      </section>

      {/* Sticky bottom action bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 px-4 md:left-64 py-3 bg-white/85 backdrop-blur-xl border-t border-surface-border">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          {!isFree ? (
            <div className="hidden md:block">
              <p className="text-[10px] uppercase tracking-widest text-ink-muted">
                total cost
              </p>
              <p className="font-display text-xl font-bold text-ink leading-none">
                ₹{event.cost_per_person_inr.toLocaleString("en-IN")}{" "}
                <span className="text-xs text-ink-muted font-normal">
                  / person
                </span>
              </p>
            </div>
          ) : (
            <div className="hidden md:block">
              <p className="text-[10px] uppercase tracking-widest text-ink-muted">
                cost
              </p>
              <p className="font-display text-xl font-bold text-success leading-none">
                Free
              </p>
            </div>
          )}
          <div className="flex-1 md:flex-none">
            {user && !isOrganizer ? (
              <RSVPButton
                eventId={event.id}
                initialStatus={myStatus}
                full={isFull}
                cancelled={isCancelled}
              />
            ) : isOrganizer ? (
              <span className="inline-flex items-center px-6 py-3 rounded-full border border-surface-border text-sm font-semibold text-ink-secondary">
                You&apos;re hosting
              </span>
            ) : (
              <SignUpCta
                label="Sign up to RSVP"
                size="lg"
                next={`/trips/${event.id}`}
              />
            )}
          </div>
          {user && (myStatus === "going" || isOrganizer) ? (
            <div className="hidden md:block">
              <OpenEventChatButton eventId={event.id} />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function FactCard({
  icon,
  label,
  children,
}: {
  icon: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white p-4 rounded-2xl border border-surface-border sun-kissed-shadow flex flex-col gap-2">
      <span className="material-symbols-outlined text-primary-600 text-xl">
        {icon}
      </span>
      <div>
        <p className="text-[10px] uppercase tracking-wider text-ink-muted font-semibold">
          {label}
        </p>
        <p className="text-sm font-semibold text-ink leading-tight mt-0.5">
          {children}
        </p>
      </div>
    </div>
  );
}
