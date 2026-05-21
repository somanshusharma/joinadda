import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/EmptyState";
import { ACTIVITY_TAGS, activityLabel } from "@/lib/config";

export const metadata: Metadata = {
  title: "Spots — venues and partners hosting on JoinAdda",
  description:
    "Browse cricket turfs, yoga studios, cafes, trek operators and other spots in Tricity that you can plan a hangout around.",
};

type ListingRow = {
  id: string;
  title: string;
  description: string | null;
  activity_tag: string;
  address: string | null;
  price_inr: number | null;
  price_unit: "per_hour" | "per_person" | "per_session" | "flat" | null;
  capacity_max: number | null;
  photo_url: string | null;
  is_featured: boolean;
  city: { name: string } | null;
};

function priceLabel(l: ListingRow): string {
  if (l.price_inr == null) return "Free / pay at venue";
  const unit =
    l.price_unit === "per_hour"
      ? "/hr"
      : l.price_unit === "per_person"
        ? "/person"
        : l.price_unit === "per_session"
          ? "/session"
          : "";
  return `₹${l.price_inr.toLocaleString("en-IN")}${unit}`;
}

export default async function SpotsPage({
  searchParams,
}: {
  searchParams: Promise<{ activity?: string }>;
}) {
  const { activity } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let canAddSpots = false;
  if (user) {
    const { data: me } = await supabase
      .from("profiles")
      .select("can_add_spots, is_admin")
      .eq("id", user.id)
      .single<{ can_add_spots: boolean; is_admin: boolean }>();
    canAddSpots = !!(me?.can_add_spots || me?.is_admin);
  }

  let q = supabase
    .from("host_listings")
    .select(
      "id, title, description, activity_tag, address, price_inr, price_unit, capacity_max, photo_url, is_featured, city:city_id(name)",
    )
    .eq("is_active", true)
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(60);
  if (activity) q = q.eq("activity_tag", activity);

  const { data } = await q;
  const listings = (data as unknown as ListingRow[]) ?? [];

  // Only show activity chips that have at least one listing
  const { data: tagData } = await supabase
    .from("host_listings")
    .select("activity_tag")
    .eq("is_active", true);
  const tagSet = new Set(
    ((tagData as { activity_tag: string }[]) ?? []).map((r) => r.activity_tag),
  );
  const visibleTags = ACTIVITY_TAGS.filter((t) => tagSet.has(t.slug));

  return (
    <div className="max-w-5xl">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl font-semibold tracking-tight text-ink">
            Spots
          </h1>
          <p className="mt-1 text-base text-ink-secondary">
            Cafes, turfs, studios, trek operators — places to plan a hangout
            around.
          </p>
        </div>
        {canAddSpots ? (
          <Link
            href="/spots/new"
            className="inline-flex items-center gap-1.5 bg-primary-500 text-white rounded-full px-5 h-10 font-semibold text-sm hover:bg-primary-600 active:scale-95 transition"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            add a spot
          </Link>
        ) : (
          <Link
            href="/for-hosts"
            className="text-sm font-semibold text-primary-600 hover:underline"
          >
            List your spot — free →
          </Link>
        )}
      </header>

      {/* Filter chips */}
      {visibleTags.length > 0 ? (
        <div className="mb-6 flex flex-wrap gap-2">
          <FilterChip
            href="/spots"
            label="All"
            icon="grid_view"
            active={!activity}
          />
          {visibleTags.map((t) => (
            <FilterChip
              key={t.slug}
              href={`/spots?activity=${t.slug}`}
              label={t.label}
              icon={t.icon}
              active={activity === t.slug}
            />
          ))}
        </div>
      ) : null}

      {listings.length === 0 ? (
        <EmptyState
          icon={
            <span className="material-symbols-outlined text-4xl">
              storefront
            </span>
          }
          title="No spots in this category yet"
          description="More venues are joining every week. Check back soon or try another filter."
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {listings.map((l) => (
            <Link
              key={l.id}
              href={`/spots/${l.id}`}
              className="bg-white border border-surface-border rounded-3xl overflow-hidden hover:border-primary-300 transition-all sun-kissed-shadow group"
            >
              <div className="aspect-[16/10] bg-surface-muted relative overflow-hidden">
                {l.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={l.photo_url}
                    alt={l.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="grid place-items-center w-full h-full">
                    <span className="material-symbols-outlined text-5xl text-ink-muted">
                      storefront
                    </span>
                  </div>
                )}
                {l.is_featured ? (
                  <span className="absolute top-3 left-3 bg-mango-500 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full">
                    ★ Verified
                  </span>
                ) : null}
              </div>
              <div className="p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-primary-600 mb-1">
                  {activityLabel(l.activity_tag)}
                </p>
                <h3 className="font-display text-lg font-bold text-ink leading-tight">
                  {l.title}
                </h3>
                {l.address ? (
                  <p className="text-xs text-ink-muted mt-1 truncate">
                    {l.address}
                  </p>
                ) : null}
                <div className="mt-3 flex items-center justify-between gap-2 text-sm">
                  <span className="font-bold text-primary-700">
                    {priceLabel(l)}
                  </span>
                  {l.capacity_max ? (
                    <span className="text-xs text-ink-muted">
                      up to {l.capacity_max}
                    </span>
                  ) : null}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterChip({
  href,
  label,
  icon,
  active,
}: {
  href: string;
  label: string;
  icon: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={
        "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-semibold transition " +
        (active
          ? "bg-primary-500 text-white"
          : "bg-white border border-surface-border text-ink-secondary hover:border-primary-300")
      }
    >
      <span className="material-symbols-outlined text-[18px]">{icon}</span>
      {label}
    </Link>
  );
}
