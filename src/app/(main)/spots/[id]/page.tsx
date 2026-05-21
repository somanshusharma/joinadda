import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/ui/Avatar";
import { activityLabel, activityIcon } from "@/lib/config";
import { ReviewList } from "@/components/reviews/ReviewList";
import { RatingBadge } from "@/components/reviews/RatingBadge";

type ListingDetail = {
  id: string;
  title: string;
  description: string | null;
  activity_tag: string;
  address: string | null;
  map_url: string | null;
  price_inr: number | null;
  price_unit: "per_hour" | "per_person" | "per_session" | "flat" | null;
  capacity_min: number | null;
  capacity_max: number | null;
  contact_phone: string | null;
  contact_whatsapp: string | null;
  photo_url: string | null;
  is_featured: boolean;
  avg_rating: number | null;
  review_count: number | null;
  host: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
    is_verified_host: boolean | null;
    host_bio: string | null;
  } | null;
  city: { name: string } | null;
};

function priceLabel(l: ListingDetail): string {
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

export default async function SpotDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("host_listings")
    .select(
      "id, title, description, activity_tag, address, map_url, price_inr, price_unit, capacity_min, capacity_max, contact_phone, contact_whatsapp, photo_url, is_featured, avg_rating, review_count, host:host_id(id, username, display_name, avatar_url, is_verified_host, host_bio), city:city_id(name)",
    )
    .eq("id", id)
    .eq("is_active", true)
    .maybeSingle<ListingDetail>();

  if (!data) notFound();

  const waNumber = data.contact_whatsapp ?? data.contact_phone;
  const waHref = waNumber
    ? `https://wa.me/${waNumber.replace(/\D/g, "")}?text=${encodeURIComponent(
        `Hi! Found ${data.title} on JoinAdda. Wanted to ask about availability.`,
      )}`
    : null;

  return (
    <div className="max-w-3xl">
      <Link
        href="/spots"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-muted hover:text-primary-600 mb-6 group transition-colors"
      >
        <span className="material-symbols-outlined text-[20px] group-hover:-translate-x-0.5 transition-transform">
          arrow_back
        </span>
        all spots
      </Link>

      <article className="bg-white rounded-[32px] overflow-hidden sun-kissed-shadow border border-surface-border">
        {/* Hero photo */}
        <div className="aspect-[16/9] bg-surface-muted relative">
          {data.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={data.photo_url}
              alt={data.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="grid place-items-center w-full h-full">
              <span className="material-symbols-outlined text-6xl text-ink-muted">
                storefront
              </span>
            </div>
          )}
          {data.is_featured ? (
            <span className="absolute top-4 left-4 bg-mango-500 text-white text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
              ★ Verified
            </span>
          ) : null}
        </div>

        <div className="p-6 md:p-8">
          {/* Activity + title */}
          <div className="flex items-center gap-2 text-primary-600 text-xs font-bold uppercase tracking-wider mb-2">
            <span className="material-symbols-outlined text-[18px]">
              {activityIcon(data.activity_tag)}
            </span>
            {activityLabel(data.activity_tag)}
          </div>
          <h1 className="font-serif text-3xl md:text-4xl font-semibold tracking-tight text-ink leading-tight">
            {data.title}
          </h1>
          {data.review_count ? (
            <div className="mt-2">
              <RatingBadge
                rating={data.avg_rating}
                count={data.review_count}
                size="md"
              />
            </div>
          ) : null}
          {data.address ? (
            <p className="mt-1 text-sm text-ink-muted">
              {data.address}
              {data.city ? ` · ${data.city.name}` : ""}
            </p>
          ) : null}

          {/* Fact pills */}
          <div className="mt-5 flex flex-wrap gap-2">
            <FactPill icon="payments">{priceLabel(data)}</FactPill>
            {data.capacity_max ? (
              <FactPill icon="group">
                {data.capacity_min ?? 2}–{data.capacity_max} people
              </FactPill>
            ) : null}
            {data.contact_phone ? (
              <FactPill icon="call">{data.contact_phone}</FactPill>
            ) : null}
          </div>

          {data.description ? (
            <p className="mt-6 text-base text-ink-secondary leading-relaxed">
              {data.description}
            </p>
          ) : null}

          {/* Primary CTA */}
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Link
              href={`/hangouts/new?listing=${data.id}`}
              className="flex-1 inline-flex items-center justify-center gap-2 h-12 px-6 rounded-full bg-primary-500 text-white font-semibold shadow-md hover:bg-primary-600 active:scale-[0.98] transition"
            >
              <span className="material-symbols-outlined text-[20px]">
                add_circle
              </span>
              Plan a hangout here
            </Link>
            {waHref ? (
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-full bg-success/10 text-success font-semibold hover:bg-success/20 transition"
              >
                <span className="material-symbols-outlined text-[20px]">
                  chat
                </span>
                WhatsApp venue
              </a>
            ) : null}
            {data.map_url ? (
              <a
                href={data.map_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-full border border-surface-border text-ink-secondary font-semibold hover:bg-surface-muted transition"
              >
                <span className="material-symbols-outlined text-[20px]">
                  near_me
                </span>
                Directions
              </a>
            ) : null}
          </div>

          <p className="mt-3 text-xs text-ink-muted text-center">
            No payment goes through JoinAdda. You book and pay the venue
            directly.
          </p>

          {/* Host card */}
          {data.host ? (
            <div className="mt-8 pt-6 border-t border-surface-border">
              <p className="text-[11px] uppercase tracking-wider text-ink-muted mb-3">
                Hosted by
              </p>
              <Link
                href={`/profile/${data.host.username}`}
                className="flex items-center gap-3 group"
              >
                <Avatar
                  name={data.host.display_name}
                  src={data.host.avatar_url}
                  seed={data.host.id}
                  size="md"
                />
                <div>
                  <p className="font-display text-base font-bold text-ink flex items-center gap-1.5 group-hover:text-primary-600 transition-colors">
                    {data.host.display_name}
                    {data.host.is_verified_host ? (
                      <span className="material-symbols-outlined text-mango-500 text-[18px]">
                        verified
                      </span>
                    ) : null}
                  </p>
                  {data.host.host_bio ? (
                    <p className="text-xs text-ink-muted line-clamp-2">
                      {data.host.host_bio}
                    </p>
                  ) : null}
                </div>
              </Link>
            </div>
          ) : null}
        </div>
      </article>

      {/* Reviews — anyone signed in can review a spot */}
      <ReviewList
        subjectType="spot"
        subjectId={data.id}
        subjectLabel={data.title}
        avgRating={data.avg_rating}
        reviewCount={data.review_count}
        canReview={true}
      />
    </div>
  );
}

function FactPill({
  icon,
  children,
}: {
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 bg-surface-low border border-surface-border rounded-full px-3 py-1.5 text-sm text-ink-secondary">
      <span className="material-symbols-outlined text-[16px] text-primary-600">
        {icon}
      </span>
      {children}
    </span>
  );
}
