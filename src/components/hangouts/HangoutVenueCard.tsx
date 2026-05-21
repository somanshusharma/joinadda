import Link from "next/link";

type Venue = {
  id: string;
  title: string;
  description: string | null;
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
  activity_tag: string;
  host: {
    id: string;
    username: string;
    display_name: string;
    is_verified_host: boolean | null;
  } | null;
};

function formatPrice(v: Venue): string {
  if (v.price_inr == null) return "Free / pay at venue";
  const unit =
    v.price_unit === "per_hour"
      ? "/hr"
      : v.price_unit === "per_person"
        ? "/person"
        : v.price_unit === "per_session"
          ? "/session"
          : "";
  return `₹${v.price_inr.toLocaleString("en-IN")}${unit}`;
}

export function HangoutVenueCard({
  venue,
  hangoutTitle,
  whenLabel,
}: {
  venue: Venue;
  hangoutTitle: string;
  whenLabel: string;
}) {
  const waMsg = encodeURIComponent(
    `Hi! Saw you on JoinAdda. I'm planning "${hangoutTitle}" (${whenLabel}). Can you confirm availability?`,
  );
  const waNumber = venue.contact_whatsapp ?? venue.contact_phone;
  const waHref = waNumber
    ? `https://wa.me/${waNumber.replace(/\D/g, "")}?text=${waMsg}`
    : null;
  const telHref = venue.contact_phone ? `tel:${venue.contact_phone}` : null;

  return (
    <section className="mt-6 bg-white border border-surface-border rounded-3xl overflow-hidden sun-kissed-shadow">
      <div className="flex items-stretch gap-0">
        {/* Photo */}
        <div className="w-32 md:w-44 shrink-0 bg-surface-muted relative">
          {venue.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={venue.photo_url}
              alt={venue.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full grid place-items-center">
              <span className="material-symbols-outlined text-4xl text-ink-muted">
                storefront
              </span>
            </div>
          )}
          {venue.is_featured ? (
            <span className="absolute top-2 left-2 bg-mango-500 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
              Verified
            </span>
          ) : null}
        </div>

        {/* Body */}
        <div className="flex-1 p-4 md:p-5 min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider text-primary-600 mb-1">
            Hosted at
          </p>
          <h3 className="font-display text-lg md:text-xl font-bold text-ink leading-tight">
            {venue.title}
          </h3>
          {venue.address ? (
            <p className="text-xs text-ink-muted mt-0.5 truncate">
              {venue.address}
            </p>
          ) : null}
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <span className="font-bold text-primary-700">
              {formatPrice(venue)}
            </span>
            {venue.capacity_max ? (
              <span className="text-ink-muted">
                · up to {venue.capacity_max} people
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {/* Description */}
      {venue.description ? (
        <p className="px-4 md:px-5 pb-4 text-sm text-ink-secondary leading-relaxed">
          {venue.description}
        </p>
      ) : null}

      {/* Contact row */}
      <div className="flex flex-wrap gap-2 px-4 md:px-5 pb-5">
        {waHref ? (
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full bg-success/10 text-success font-semibold text-sm hover:bg-success/20 transition"
          >
            <span className="material-symbols-outlined text-[18px]">
              chat
            </span>
            WhatsApp venue
          </a>
        ) : null}
        {telHref ? (
          <a
            href={telHref}
            className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full border border-surface-border text-ink-secondary font-semibold text-sm hover:bg-surface-muted transition"
          >
            <span className="material-symbols-outlined text-[18px]">
              call
            </span>
            Call
          </a>
        ) : null}
        {venue.map_url ? (
          <a
            href={venue.map_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full border border-surface-border text-ink-secondary font-semibold text-sm hover:bg-surface-muted transition"
          >
            <span className="material-symbols-outlined text-[18px]">
              near_me
            </span>
            Directions
          </a>
        ) : null}
        {venue.host ? (
          <Link
            href={`/profile/${venue.host.username}`}
            className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full text-ink-muted hover:text-primary-600 text-sm font-semibold transition ml-auto"
          >
            by {venue.host.display_name}
            {venue.host.is_verified_host ? (
              <span className="material-symbols-outlined text-mango-500 text-[16px]">
                verified
              </span>
            ) : null}
          </Link>
        ) : null}
      </div>

      <p className="bg-sky/30 border-t border-sky/60 px-4 md:px-5 py-2.5 text-xs text-ink-secondary">
        💡 No payment goes through JoinAdda. The venue confirms and bills you
        directly.
      </p>
    </section>
  );
}
