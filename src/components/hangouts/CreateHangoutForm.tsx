"use client";

import { useEffect, useState, useTransition } from "react";
import { createHangout } from "@/app/actions/hangout";
import {
  fetchListingsForActivity,
  type ListingCard,
} from "@/app/actions/listings";
import { ACTIVITY_TAGS, activityLabel } from "@/lib/config";
import { cn } from "@/lib/utils";

export type PrefilledListing = {
  id: string;
  title: string;
  activity_tag: string;
  address: string | null;
  price_inr: number | null;
  price_unit: "per_hour" | "per_person" | "per_session" | "flat" | null;
  capacity_max: number | null;
  photo_url: string | null;
};

type WhenKey = "tonight" | "tomorrow" | "this weekend" | "next week" | "pick a date";
const WHEN_OPTIONS: WhenKey[] = [
  "tonight",
  "tomorrow",
  "this weekend",
  "next week",
  "pick a date",
];

function formatPrice(l: {
  price_inr: number | null;
  price_unit: PrefilledListing["price_unit"];
}): string {
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

export function CreateHangoutForm({
  cityId,
  prefilledListing = null,
}: {
  cityId: string | null;
  prefilledListing?: PrefilledListing | null;
}) {
  const [activityTag, setActivityTag] = useState<string | null>(
    prefilledListing?.activity_tag ?? null,
  );
  const [title, setTitle] = useState(
    prefilledListing
      ? `${activityLabel(prefilledListing.activity_tag)} at ${prefilledListing.title}`
      : "",
  );
  const [titleTouched, setTitleTouched] = useState(!!prefilledListing);
  const [whenKey, setWhenKey] = useState<WhenKey>("this weekend");
  const [customDate, setCustomDate] = useState("");
  const [location, setLocation] = useState("");
  const [maxJoiners, setMaxJoiners] = useState(4);
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [listings, setListings] = useState<ListingCard[]>([]);
  const [loadingListings, setLoadingListings] = useState(false);
  const [pickedListingId, setPickedListingId] = useState<string | null>(
    prefilledListing?.id ?? null,
  );

  // When activity tag changes, fetch matching listings in user's city
  useEffect(() => {
    if (!activityTag || !cityId) {
      setListings([]);
      return;
    }
    let cancelled = false;
    setLoadingListings(true);
    fetchListingsForActivity(cityId, activityTag).then((rows) => {
      if (cancelled) return;
      setListings(rows);
      setLoadingListings(false);
    });
    return () => {
      cancelled = true;
    };
  }, [activityTag, cityId]);

  // Auto-suggest title from activity + (optional) venue, until user types
  useEffect(() => {
    if (titleTouched) return;
    if (!activityTag) {
      setTitle("");
      return;
    }
    const venueName = listings.find((l) => l.id === pickedListingId)?.title;
    setTitle(
      venueName
        ? `${activityLabel(activityTag)} at ${venueName}`
        : activityLabel(activityTag),
    );
  }, [activityTag, pickedListingId, listings, titleTouched]);

  const pickedListing =
    listings.find((l) => l.id === pickedListingId) ??
    (prefilledListing && pickedListingId === prefilledListing.id
      ? {
          id: prefilledListing.id,
          title: prefilledListing.title,
          activity_tag: prefilledListing.activity_tag,
          address: prefilledListing.address,
          price_inr: prefilledListing.price_inr,
          price_unit: prefilledListing.price_unit,
          capacity_min: null,
          capacity_max: prefilledListing.capacity_max,
          photo_url: prefilledListing.photo_url,
          is_featured: false,
        }
      : null);

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await createHangout({
        activity: title.trim(),
        description,
        time_window:
          whenKey === "pick a date" && customDate
            ? new Date(customDate).toLocaleDateString(undefined, {
                weekday: "short",
                month: "short",
                day: "numeric",
              })
            : whenKey,
        starts_at:
          whenKey === "pick a date" && customDate
            ? new Date(customDate).toISOString()
            : null,
        location: pickedListingId
          ? location || pickedListing?.address || "TBA"
          : location,
        max_joiners: maxJoiners,
        activity_tag: activityTag,
        host_listing_id: pickedListingId,
      });
      if (res && !res.ok) setError(res.error);
    });
  }

  return (
    <div className="space-y-10 pb-32 md:pb-12">
      {/* 1. Activity — the entry point */}
      <Section
        n={1}
        label="Pick an activity"
        sub="We'll suggest spots based on this."
      >
        <div className="flex flex-wrap gap-2">
          {ACTIVITY_TAGS.map((t) => {
            const isActive = activityTag === t.slug;
            return (
              <button
                key={t.slug}
                type="button"
                onClick={() => {
                  setActivityTag(isActive ? null : t.slug);
                  if (isActive) setPickedListingId(null);
                }}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-semibold transition-all active:scale-95",
                  isActive
                    ? "bg-primary-500 text-white"
                    : "bg-white border border-surface-border text-ink-secondary hover:border-primary-300",
                )}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {t.icon}
                </span>
                {t.label}
              </button>
            );
          })}
        </div>
      </Section>

      {/* 2. Venue (only when activity is set) */}
      {activityTag ? (
        <Section
          n={2}
          label="Pick a spot — or keep it informal"
          sub={
            listings.length > 0
              ? "Tap a spot to plan around it. Or skip and pick your own place below."
              : undefined
          }
        >
          {loadingListings ? (
            <p className="text-sm text-ink-muted px-1">
              Looking up nearby spots…
            </p>
          ) : listings.length === 0 ? (
            <div className="bg-surface-low rounded-2xl border border-dashed border-surface-border p-5">
              <p className="text-sm text-ink-secondary">
                No registered spots for this activity in your city yet. No
                worries — pick your own place below.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {listings.map((l) => {
                const isPicked = pickedListingId === l.id;
                return (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() =>
                      setPickedListingId(isPicked ? null : l.id)
                    }
                    className={cn(
                      "w-full text-left flex items-center gap-3 rounded-2xl p-3 border transition-all",
                      isPicked
                        ? "border-primary-500 bg-primary-50 sun-kissed-shadow"
                        : "border-surface-border bg-white hover:border-primary-300",
                    )}
                  >
                    <div className="size-14 shrink-0 rounded-xl bg-surface-muted grid place-items-center overflow-hidden">
                      {l.photo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={l.photo_url}
                          alt={l.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="material-symbols-outlined text-ink-muted">
                          storefront
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-ink truncate">
                        {l.title}
                      </p>
                      {l.address ? (
                        <p className="text-xs text-ink-muted truncate">
                          {l.address}
                        </p>
                      ) : null}
                      <p className="text-xs text-ink-secondary mt-0.5">
                        <span className="font-semibold text-primary-600">
                          {formatPrice(l)}
                        </span>
                        {l.capacity_max ? (
                          <span className="text-ink-muted">
                            {" "}
                            · up to {l.capacity_max}
                          </span>
                        ) : null}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "material-symbols-outlined text-[22px]",
                        isPicked ? "text-primary-600" : "text-ink-muted",
                      )}
                    >
                      {isPicked ? "check_circle" : "radio_button_unchecked"}
                    </span>
                  </button>
                );
              })}
              {pickedListingId ? (
                <button
                  type="button"
                  onClick={() => setPickedListingId(null)}
                  className="text-xs text-ink-muted hover:text-ink underline px-1"
                >
                  Clear selection — keep it informal
                </button>
              ) : null}
            </div>
          )}
        </Section>
      ) : null}

      {/* 3. When */}
      {activityTag ? (
        <Section n={3} label="When?">
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4 md:mx-0 md:px-0">
            {WHEN_OPTIONS.map((opt) => {
              const isActive = whenKey === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setWhenKey(opt)}
                  className={cn(
                    "shrink-0 px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all",
                    isActive
                      ? "bg-primary-500 text-white sun-kissed-shadow"
                      : "bg-surface-muted border border-surface-border text-ink-secondary hover:bg-surface-low",
                  )}
                >
                  {opt}
                </button>
              );
            })}
          </div>
          {whenKey === "pick a date" ? (
            <input
              type="datetime-local"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              className="mt-3 w-full bg-surface-low border border-surface-border rounded-2xl py-3 px-5 focus:ring-2 focus:ring-primary-300 focus:border-primary-400 outline-none text-base"
            />
          ) : null}
        </Section>
      ) : null}

      {/* 4. Where — only if no venue picked */}
      {activityTag && !pickedListingId ? (
        <Section n={4} label="Where?">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted">
              location_on
            </span>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Sector 26 Mohali, or 'anywhere in Mohali'"
              className="w-full bg-surface-low border border-surface-border rounded-2xl py-3 pl-12 pr-5 focus:ring-2 focus:ring-primary-300 focus:border-primary-400 outline-none transition-all text-base placeholder:text-ink-light"
            />
          </div>
        </Section>
      ) : null}

      {/* 5. How many */}
      {activityTag ? (
        <Section n={pickedListingId ? 4 : 5} label="How many people?">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-xs text-ink-muted">min 2</span>
            <span className="font-display text-2xl font-semibold text-primary-600">
              {maxJoiners}
            </span>
            <span className="text-xs text-ink-muted">max 10</span>
          </div>
          <input
            type="range"
            min={2}
            max={10}
            value={maxJoiners}
            onChange={(e) => setMaxJoiners(Number(e.target.value))}
            className="adda-range w-full"
          />
        </Section>
      ) : null}

      {/* 6. Title + optional details (collapsed) */}
      {activityTag ? (
        <Section
          n={pickedListingId ? 5 : 6}
          label="Title & note"
          sub="We've auto-filled the title. Tweak if you want."
        >
          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitleTouched(true);
              setTitle(e.target.value);
            }}
            placeholder="Coffee at Blue Tokai"
            className="w-full bg-surface-low border border-surface-border rounded-2xl py-3 px-5 focus:ring-2 focus:ring-primary-300 focus:border-primary-400 outline-none transition-all text-base placeholder:text-ink-light"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Anything to add? (optional) — bringing my dog, split bills equally, etc."
            rows={2}
            maxLength={300}
            className="mt-3 w-full bg-surface-low border border-surface-border rounded-2xl py-3 px-5 focus:ring-2 focus:ring-primary-300 focus:border-primary-400 outline-none transition-all text-sm placeholder:text-ink-light resize-none"
          />
        </Section>
      ) : null}

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      {/* Inline submit on desktop */}
      <div className="hidden md:block pt-2">
        <button
          type="button"
          onClick={submit}
          disabled={pending || !activityTag || !title.trim()}
          className="w-full h-[56px] bg-primary-500 text-white font-bold text-base rounded-full sun-kissed-shadow hover:bg-primary-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {pending ? "Posting…" : "post hangout"}
          {!pending ? (
            <span className="material-symbols-outlined">send</span>
          ) : null}
        </button>
        <p className="text-center mt-3 text-ink-muted text-xs">
          {pickedListingId
            ? "We'll let the venue know — they'll WhatsApp you to confirm."
            : "Your network will see this. No pressure to join."}
        </p>
      </div>

      {/* Sticky mobile submit */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 p-4 bg-surface/90 backdrop-blur-xl border-t border-surface-border">
        <button
          type="button"
          onClick={submit}
          disabled={pending || !activityTag || !title.trim()}
          className="w-full h-12 bg-primary-500 text-white rounded-full font-bold text-base sun-kissed-shadow active:scale-95 transition-all hover:bg-primary-600 disabled:opacity-50"
        >
          {pending ? "Posting…" : "post hangout"}
        </button>
      </div>

      <style jsx>{`
        .adda-range {
          -webkit-appearance: none;
          width: 100%;
          background: transparent;
        }
        .adda-range::-webkit-slider-runnable-track {
          width: 100%;
          height: 6px;
          background: var(--color-surface-border);
          border-radius: 3px;
        }
        .adda-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 24px;
          width: 24px;
          border-radius: 50%;
          background: var(--color-primary-700);
          cursor: pointer;
          margin-top: -9px;
          box-shadow: 0 2px 8px rgba(168, 57, 0, 0.3);
        }
        .adda-range::-moz-range-track {
          height: 6px;
          background: var(--color-surface-border);
          border-radius: 3px;
        }
        .adda-range::-moz-range-thumb {
          height: 24px;
          width: 24px;
          border-radius: 50%;
          background: var(--color-primary-700);
          border: none;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(168, 57, 0, 0.3);
        }
      `}</style>
    </div>
  );
}

function Section({
  n,
  label,
  sub,
  children,
}: {
  n: number;
  label: string;
  sub?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-baseline gap-2 px-1">
        <span className="text-[11px] font-bold text-primary-600 tracking-wider">
          {String(n).padStart(2, "0")}
        </span>
        <label className="text-sm font-semibold text-ink">{label}</label>
      </div>
      {sub ? (
        <p className="text-xs text-ink-muted px-1 -mt-1.5">{sub}</p>
      ) : null}
      {children}
    </section>
  );
}
