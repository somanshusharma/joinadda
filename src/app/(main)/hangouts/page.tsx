import Link from "next/link";
import { Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  HangoutCard,
  type HangoutCardData,
} from "@/components/hangouts/HangoutCard";
import { TopHosts } from "@/components/hangouts/TopHosts";
import { loadJoinerPreviews } from "@/lib/hangouts";
import { cn } from "@/lib/utils";

type Filter =
  | "all"
  | "today"
  | "weekend"
  | "coffee"
  | "food"
  | "movies"
  | "sports"
  | "workout"
  | "study"
  | "travel";

const FILTERS: { key: Filter; label: string; match?: RegExp }[] = [
  { key: "all", label: "all" },
  { key: "today", label: "today" },
  { key: "weekend", label: "this weekend" },
  { key: "coffee", label: "coffee", match: /coffee|chai|cafe/i },
  { key: "food", label: "food", match: /food|paratha|dinner|lunch|breakfast|brunch/i },
  { key: "movies", label: "movies", match: /movie|film|cinema|imax/i },
  { key: "sports", label: "sports", match: /cricket|badminton|tennis|football|run|cycl|swim/i },
  { key: "workout", label: "workout", match: /gym|yoga|workout|run/i },
  { key: "study", label: "study", match: /study|read|book/i },
  { key: "travel", label: "travel", match: /trip|drive|trek|hike|getaway/i },
];

export default async function HangoutsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter: rawFilter } = await searchParams;
  const filter = (FILTERS.find((f) => f.key === rawFilter)?.key ?? "all") as Filter;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [meRes, joinedRes] = user
    ? await Promise.all([
        supabase
          .from("profiles")
          .select("current_city_id, current_city:current_city_id(name)")
          .eq("id", user.id)
          .single<{
            current_city_id: string | null;
            current_city: { name: string } | null;
          }>(),
        supabase
          .from("hangout_joiners")
          .select("hangout_id")
          .eq("profile_id", user.id),
      ])
    : [{ data: null }, { data: null }];

  const me = meRes.data;
  const joined = joinedRes.data;
  const joinedIds = new Set((joined ?? []).map((j) => j.hangout_id));

  let query = supabase
    .from("hangouts")
    .select(
      "id, activity, description, time_window, location, joiner_count, max_joiners, status, host:host_id(id, username, display_name, avatar_url)",
    )
    .eq("status", "open")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(60);
  if (me?.current_city_id) query = query.eq("city_id", me.current_city_id);

  const { data } = await query;
  let hangouts = (data as unknown as HangoutCardData[]) ?? [];

  if (filter === "today") {
    hangouts = hangouts.filter((h) =>
      /tonight|tomorrow|today/i.test(h.time_window),
    );
  } else if (filter === "weekend") {
    hangouts = hangouts.filter((h) =>
      /weekend|saturday|sunday|sat|sun/i.test(h.time_window),
    );
  } else {
    const cfg = FILTERS.find((f) => f.key === filter);
    if (cfg?.match) {
      hangouts = hangouts.filter(
        (h) =>
          cfg.match!.test(h.activity) || cfg.match!.test(h.description ?? ""),
      );
    }
  }

  const joinerPreviews = await loadJoinerPreviews(
    supabase,
    hangouts.map((h) => h.id),
  );

  const cityName = me?.current_city?.name ?? "your city";

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <section className="mb-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl md:text-4xl font-semibold tracking-tight text-ink leading-tight mb-2">
              hangouts in {cityName.toLowerCase()}
            </h1>
            <p className="text-base text-ink-secondary">
              casual invites. just say &apos;i&apos;m in&apos;.
            </p>
          </div>
          <Link
            href="/hangouts/new"
            className="inline-flex items-center gap-2 bg-primary-500 text-white rounded-full px-6 h-12 font-semibold text-sm w-fit active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            plan one
          </Link>
        </div>
      </section>

      {/* Filter chips */}
      <section className="mb-8">
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4 md:mx-0 md:px-0">
          {FILTERS.map((f) => {
            const isActive = f.key === filter;
            return (
              <Link
                key={f.key}
                href={`/hangouts${f.key === "all" ? "" : `?filter=${f.key}`}`}
                className={cn(
                  "shrink-0 rounded-full px-5 py-2 text-sm font-semibold transition-colors",
                  isActive
                    ? "bg-primary-500 text-white"
                    : "bg-surface-muted text-ink-secondary hover:bg-surface-low",
                )}
              >
                {f.label}
              </Link>
            );
          })}
        </div>
      </section>

      {/* Top hosts */}
      <div className="mb-6">
        <TopHosts cityId={me?.current_city_id ?? null} />
      </div>

      {/* Cards */}
      {hangouts.length === 0 ? (
        <EmptyState
          icon={<Sparkles />}
          title="nothing on the board yet."
          description="drop the first invite — coffee, a movie, study session. 30 seconds, takes literally nothing."
          action={
            <Link
              href="/hangouts/new"
              className="inline-flex items-center gap-2 bg-primary-500 text-white rounded-full px-6 h-12 font-semibold text-sm"
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
              plan a hangout
            </Link>
          }
        />
      ) : (
        <div className="space-y-6">
          {hangouts.map((h) => (
            <HangoutCard
              key={h.id}
              hangout={h}
              currentUserId={user?.id ?? null}
              joined={joinedIds.has(h.id)}
              joiners={joinerPreviews.get(h.id) ?? []}
            />
          ))}
        </div>
      )}
    </div>
  );
}
