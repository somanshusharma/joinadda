import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { type AttendeePreview } from "./AttendeeStack";

export type EventCardData = {
  id: string;
  title: string;
  description: string;
  cover_image_url: string | null;
  type: "trip" | "workcation" | "hangout" | "community_event";
  location: string;
  starts_at: string;
  cost_per_person_inr: number;
  attendee_count: number;
  max_attendees: number | null;
  status: "open" | "full" | "cancelled" | "completed";
  city: { name: string } | null;
  organizer?: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
  } | null;
};

const TYPE_VIBE_LABEL: Record<EventCardData["type"], string> = {
  trip: "Mountain Air",
  workcation: "Workcation",
  hangout: "Chai & Code",
  community_event: "Meetup",
};

const TYPE_GRADIENT: Record<EventCardData["type"], string> = {
  trip: "from-emerald-200 via-accent-100 to-primary-100",
  workcation: "from-sky-200 via-violet-100 to-primary-100",
  hangout: "from-primary-200 via-accent-100 to-rose-100",
  community_event: "from-violet-200 via-accent-100 to-primary-100",
};

const TYPE_ICON: Record<EventCardData["type"], string> = {
  trip: "flight_takeoff",
  workcation: "laptop_mac",
  hangout: "local_cafe",
  community_event: "groups",
};

function relativeWhen(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const dayMs = 24 * 60 * 60 * 1000;
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfThat = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round((startOfThat - startOfToday) / dayMs);
  const time = d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  if (diffDays === 0) return `Today, ${time}`;
  if (diffDays === 1) return `Tomorrow, ${time}`;
  if (diffDays > 1 && diffDays < 7) {
    return `${d.toLocaleDateString(undefined, { weekday: "long" })}, ${time}`;
  }
  if (diffDays >= 7 && diffDays < 14) return `Next weekend`;
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function EventCard({
  event,
}: {
  event: EventCardData;
  attendees?: AttendeePreview[]; // kept for back-compat; not used in this layout
}) {
  const isFree = event.cost_per_person_inr <= 0;
  const isFull =
    event.max_attendees !== null && event.attendee_count >= event.max_attendees;
  const isCancelled = event.status === "cancelled";

  const spotsLeft =
    event.max_attendees !== null
      ? Math.max(0, event.max_attendees - event.attendee_count)
      : null;

  let leftBadge: { text: string; tone: "light" | "warn" | "danger" } = {
    text: "",
    tone: "light",
  };
  if (isCancelled) leftBadge = { text: "Cancelled", tone: "danger" };
  else if (isFull) leftBadge = { text: "Full house", tone: "warn" };
  else if (spotsLeft !== null && spotsLeft <= 5 && spotsLeft > 0)
    leftBadge = {
      text: `${spotsLeft} spot${spotsLeft === 1 ? "" : "s"} left`,
      tone: "warn",
    };
  else if (event.attendee_count > 0)
    leftBadge = {
      text: `${event.attendee_count} friend${event.attendee_count === 1 ? "" : "s"} going`,
      tone: "light",
    };

  const firstName = event.organizer?.display_name.split(" ")[0];

  return (
    <article className="group bg-surface-elevated rounded-2xl border border-surface-border overflow-hidden shadow-sm hover:shadow-lg transition-all flex flex-col">
      <Link href={`/trips/${event.id}`} className="relative h-56 block">
        {event.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={event.cover_image_url}
            alt=""
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div
            className={`w-full h-full bg-gradient-to-br ${TYPE_GRADIENT[event.type]} grid place-items-center`}
          >
            <span className="material-symbols-outlined text-primary-700 text-[64px] opacity-70">
              {TYPE_ICON[event.type]}
            </span>
          </div>
        )}

        {/* Price badge — top right */}
        <div
          className={
            "absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold shadow-sm " +
            (isFree
              ? "bg-success text-white"
              : "bg-primary-500 text-white")
          }
        >
          {isFree
            ? "Free"
            : `₹${event.cost_per_person_inr.toLocaleString("en-IN")}`}
        </div>

        {/* Status/spots badge — top left */}
        {leftBadge.text ? (
          <div
            className={
              "absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md " +
              (leftBadge.tone === "danger"
                ? "bg-danger/90 text-white"
                : leftBadge.tone === "warn"
                  ? "bg-accent-400/95 text-amber-950"
                  : "bg-white/90 text-ink")
            }
          >
            {leftBadge.text}
          </div>
        ) : null}
      </Link>

      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center justify-between mb-3 gap-2">
          {event.organizer ? (
            <Link
              href={`/profile/${event.organizer.username}`}
              className="flex items-center gap-2 min-w-0"
            >
              <Avatar
                name={event.organizer.display_name}
                src={event.organizer.avatar_url}
                seed={event.organizer.id}
                size="sm"
                className="ring-2 ring-primary-100"
              />
              <span className="text-xs font-bold text-ink-secondary truncate">
                {firstName}&apos;s hosting
              </span>
            </Link>
          ) : (
            <span />
          )}
          <span className="shrink-0 bg-primary-100 text-primary-700 px-2 py-1 rounded-lg text-[11px] font-bold">
            {TYPE_VIBE_LABEL[event.type]}
          </span>
        </div>

        <Link href={`/trips/${event.id}`}>
          <h3 className="text-lg font-semibold leading-snug text-ink mb-3 group-hover:text-primary-700 transition-colors">
            {event.title}
          </h3>
        </Link>

        <div className="space-y-1.5 mb-5">
          <div className="flex items-center text-ink-muted text-sm">
            <span className="material-symbols-outlined text-[18px] mr-2">
              schedule
            </span>
            {relativeWhen(event.starts_at)}
          </div>
          <div className="flex items-center text-ink-muted text-sm">
            <span className="material-symbols-outlined text-[18px] mr-2">
              location_on
            </span>
            <span className="truncate">
              {event.location}
              {event.city ? `, ${event.city.name}` : ""}
            </span>
          </div>
        </div>

        <Link
          href={`/trips/${event.id}`}
          className="mt-auto w-full bg-primary-100 text-primary-700 hover:bg-primary-500 hover:text-white font-semibold text-sm py-3 rounded-2xl transition-all flex justify-center items-center gap-2 active:scale-95"
        >
          <span className="material-symbols-outlined text-[18px]">
            {TYPE_ICON[event.type]}
          </span>
          Count me in!
        </Link>
      </div>
    </article>
  );
}
