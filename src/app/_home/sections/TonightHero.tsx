import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type Candidate = {
  id: string;
  title: string;
  starts_at: string;
  max_attendees: number | null;
  attendee_count: number;
  location: string;
  city: { name: string } | null;
};

async function pickTonightEvent(
  cityId: string | null,
  userId: string | null,
): Promise<Candidate | null> {
  const supabase = await createClient();
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endToday = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  const endTomorrow = new Date(start.getTime() + 2 * 24 * 60 * 60 * 1000);
  const endWeek = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);

  let excluded: string[] = [];
  if (userId) {
    const { data: rsvps } = await supabase
      .from("event_rsvps")
      .select("event_id")
      .eq("profile_id", userId);
    excluded = (rsvps ?? []).map((r) => r.event_id);
  }

  const baseSelect =
    "id, title, starts_at, max_attendees, attendee_count, location, city:city_id(name)";

  async function tryRange(from: Date, to: Date): Promise<Candidate | null> {
    let q = supabase
      .from("events")
      .select(baseSelect)
      .eq("status", "open")
      .gte("starts_at", from.toISOString())
      .lt("starts_at", to.toISOString())
      .order("starts_at", { ascending: true })
      .limit(20);
    if (cityId) q = q.eq("city_id", cityId);
    const { data } = await q;
    const rows = ((data as unknown as Candidate[]) ?? []).filter(
      (e) =>
        !excluded.includes(e.id) &&
        (e.max_attendees === null || e.attendee_count < e.max_attendees),
    );
    if (rows.length === 0) return null;
    rows.sort((a, b) => {
      const al =
        a.max_attendees !== null ? a.max_attendees - a.attendee_count : Infinity;
      const bl =
        b.max_attendees !== null ? b.max_attendees - b.attendee_count : Infinity;
      return al - bl;
    });
    return rows[0];
  }

  return (
    (await tryRange(new Date(), endToday)) ||
    (await tryRange(endToday, endTomorrow)) ||
    (await tryRange(endTomorrow, endWeek))
  );
}

export async function TonightHero({
  cityId,
  userId,
}: {
  cityId: string | null;
  userId: string | null;
}) {
  const event = await pickTonightEvent(cityId, userId);

  if (!event) {
    return (
      <Link
        href="/hangouts/new"
        className="block mango-gradient rounded-3xl p-6 md:p-8 text-white sun-kissed-shadow relative overflow-hidden transition-transform active:scale-[0.98]"
      >
        <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
        <p className="text-sm text-white/85 mb-2">Nothing happening tonight</p>
        <h3 className="font-serif text-2xl md:text-3xl font-semibold leading-tight mb-4">
          Want to plan something? It takes 2 minutes.
        </h3>
        <span className="inline-flex bg-white text-primary-600 font-bold text-sm px-6 py-3 rounded-full">
          Plan a hangout →
        </span>
      </Link>
    );
  }

  const spotsLeft =
    event.max_attendees !== null
      ? Math.max(0, event.max_attendees - event.attendee_count)
      : null;

  const when = new Date(event.starts_at);
  const isToday = when.toDateString() === new Date().toDateString();
  const timeLabel = when.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <Link
      href={`/trips/${event.id}`}
      className="block mango-gradient rounded-3xl p-6 md:p-8 text-white sun-kissed-shadow relative overflow-hidden transition-transform active:scale-[0.98] hover:-translate-y-1 duration-200"
    >
      <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
      <div className="absolute -left-4 -top-4 w-24 h-24 bg-white/5 rounded-full blur-xl" />

      <div className="relative">
        <p className="text-sm text-white/85 mb-2">
          Happening {isToday ? "tonight" : "soon"}
          {event.city ? ` in ${event.city.name}` : ""}
        </p>
        <h3 className="font-serif text-2xl md:text-3xl font-semibold leading-snug mb-3">
          {event.title}
          {spotsLeft !== null && spotsLeft > 0 ? (
            <>
              {" · "}
              <span className="inline-block bg-white/20 text-white px-2.5 py-0.5 rounded-full text-base align-middle">
                {spotsLeft} spot{spotsLeft === 1 ? "" : "s"} left
              </span>
            </>
          ) : null}
        </h3>
        <div className="flex items-center gap-2 mb-6 opacity-90">
          <span className="material-symbols-outlined text-[18px]">schedule</span>
          <span className="text-sm">
            {isToday
              ? "Today"
              : when.toLocaleDateString(undefined, { weekday: "short" })}
            {" · "}
            {timeLabel} · {event.location}
          </span>
        </div>
        <span className="inline-flex items-center bg-white text-primary-600 font-bold text-sm px-6 py-3 rounded-full">
          Join now →
        </span>
      </div>
    </Link>
  );
}
