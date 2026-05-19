import Link from "next/link";
import { CalendarDays, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { EventCard, type EventCardData } from "@/components/events/EventCard";
import { EVENT_COLUMNS } from "@/lib/events";

type Filter = "all" | "hangout" | "trip" | "workcation" | "community_event" | "free";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All Vibes" },
  { key: "hangout", label: "Chai & Code" },
  { key: "trip", label: "Mountain Air" },
  { key: "workcation", label: "Workcations" },
  { key: "community_event", label: "Meetups" },
  { key: "free", label: "Just for free" },
];

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; city?: string }>;
}) {
  const { filter: rawFilter, city: cityScope } = await searchParams;
  const filter: Filter = (FILTERS.find((f) => f.key === rawFilter)?.key ?? "all") as Filter;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: me } = user
    ? await supabase
        .from("profiles")
        .select("current_city_id, current_city:current_city_id(name)")
        .eq("id", user.id)
        .single<{
          current_city_id: string | null;
          current_city: { name: string } | null;
        }>()
    : { data: null };

  let query = supabase
    .from("events")
    .select(EVENT_COLUMNS)
    .neq("status", "cancelled")
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true })
    .limit(40);

  if (cityScope !== "all" && me?.current_city_id) {
    query = query.eq("city_id", me.current_city_id);
  }
  if (filter === "free") {
    query = query.eq("cost_per_person_inr", 0);
  } else if (filter !== "all") {
    query = query.eq("type", filter);
  }

  const { data } = await query;
  const events = (data as unknown as EventCardData[]) ?? [];

  const cityName = me?.current_city?.name ?? "your city";

  return (
    <div>
      {/* Hero */}
      <section className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-[40px] font-semibold tracking-tight text-ink leading-tight mb-2">
            Weekend Planner
          </h1>
          <p className="text-base text-ink-secondary">
            Find the perfect vibe for your next weekend in {cityName}.
          </p>
        </div>
        <Link href="/trips/create" className="shrink-0">
          <Button size="sm">
            <Plus className="size-4" /> Plan a hangout
          </Button>
        </Link>
      </section>

      {/* Filters */}
      <section className="mb-8 flex flex-wrap items-center gap-3">
        <div className="flex overflow-x-auto no-scrollbar gap-2 py-1 -my-1 flex-1 min-w-0">
          {FILTERS.map((f) => {
            const isActive = f.key === filter;
            return (
              <Link
                key={f.key}
                href={`/trips?filter=${f.key}${cityScope ? `&city=${cityScope}` : ""}`}
                className={
                  "whitespace-nowrap rounded-full px-5 py-2 text-sm font-semibold transition-all " +
                  (isActive
                    ? "bg-primary-500 text-white shadow-sm"
                    : "bg-surface-muted border border-surface-border text-ink-secondary hover:border-primary-300 hover:bg-primary-50")
                }
              >
                {f.label}
              </Link>
            );
          })}
        </div>
        <div className="h-6 w-px bg-surface-border hidden md:block" />
        <div className="flex items-center gap-2">
          <Link
            href={`/trips?filter=${filter}`}
            className={
              "rounded-full px-4 py-2 text-xs font-semibold transition " +
              (cityScope !== "all"
                ? "bg-primary-100 text-primary-700"
                : "text-ink-muted hover:text-ink")
            }
          >
            In {cityName}
          </Link>
          <Link
            href={`/trips?filter=${filter}&city=all`}
            className={
              "rounded-full px-4 py-2 text-xs font-semibold transition " +
              (cityScope === "all"
                ? "bg-primary-100 text-primary-700"
                : "text-ink-muted hover:text-ink")
            }
          >
            Everywhere
          </Link>
        </div>
      </section>

      {/* Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {events.length === 0 ? (
          <div className="md:col-span-2 xl:col-span-3">
            <EmptyState
              icon={<CalendarDays />}
              title="Nothing planned yet."
              description="Be the first — create something fun for this weekend."
              action={
                <Link href="/trips/create">
                  <Button>
                    <Plus className="size-4" /> Plan a hangout
                  </Button>
                </Link>
              }
            />
          </div>
        ) : (
          events.map((e) => <EventCard key={e.id} event={e} />)
        )}
      </section>
    </div>
  );
}
