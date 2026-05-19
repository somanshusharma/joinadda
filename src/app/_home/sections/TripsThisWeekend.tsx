import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { EVENT_COLUMNS } from "@/lib/events";
import type { EventCardData } from "@/components/events/EventCard";

export async function TripsThisWeekend({ cityId }: { cityId: string | null }) {
  const supabase = await createClient();
  const now = new Date();
  const twoWeeks = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  const { data } = await supabase
    .from("events")
    .select(EVENT_COLUMNS)
    .in("type", ["trip", "workcation"])
    .eq("status", "open")
    .gte("starts_at", now.toISOString())
    .lte("starts_at", twoWeeks.toISOString())
    .order("starts_at", { ascending: true })
    .limit(8);

  let trips = (data as unknown as EventCardData[]) ?? [];
  if (cityId) {
    trips = [
      ...trips.filter(
        (t) => (t as unknown as { city_id?: string }).city_id === cityId,
      ),
      ...trips.filter(
        (t) => (t as unknown as { city_id?: string }).city_id !== cityId,
      ),
    ];
  }
  trips = trips.slice(0, 8);

  if (trips.length === 0) {
    return (
      <p className="text-sm text-ink-muted">
        No trips planned yet. Be the first.
      </p>
    );
  }

  return (
    <div className="flex gap-4 overflow-x-auto no-scrollbar -mx-4 px-4 md:mx-0 md:px-0 pb-2">
      {trips.map((t) => (
        <CompactTripCard key={t.id} trip={t} />
      ))}
    </div>
  );
}

function CompactTripCard({ trip }: { trip: EventCardData }) {
  const d = new Date(trip.starts_at);
  const dateStr = d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
  const isFree = trip.cost_per_person_inr <= 0;
  return (
    <Link
      href={`/trips/${trip.id}`}
      className="shrink-0 w-72 bg-white rounded-3xl overflow-hidden sun-kissed-shadow border border-surface-border snap-start transition-transform hover:-translate-y-1"
    >
      <div className="h-40 relative">
        {trip.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={trip.cover_image_url}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-peach via-mango-300 to-primary-200 grid place-items-center">
            <span className="material-symbols-outlined text-primary-700 text-[48px] opacity-70">
              flight_takeoff
            </span>
          </div>
        )}
        <span className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[12px] font-semibold text-primary-600">
          {isFree ? "Free" : `₹${trip.cost_per_person_inr.toLocaleString("en-IN")}`}
        </span>
        <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide text-ink-secondary">
          {dateStr}
        </span>
      </div>
      <div className="p-5">
        <h5 className="font-display text-lg font-semibold text-ink mb-1 line-clamp-1">
          {trip.title}
        </h5>
        <p className="text-sm text-ink-muted flex items-center gap-1">
          <span className="material-symbols-outlined text-[16px]">groups</span>
          {trip.attendee_count} going
        </p>
      </div>
    </Link>
  );
}
