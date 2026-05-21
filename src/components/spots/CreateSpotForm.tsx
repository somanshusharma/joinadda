"use client";

import { useState, useTransition } from "react";
import { createSpot } from "@/app/actions/spots";
import { ACTIVITY_TAGS } from "@/lib/config";
import { cn } from "@/lib/utils";

type PriceUnit = "per_hour" | "per_person" | "per_session" | "flat" | "";

export function CreateSpotForm() {
  const [title, setTitle] = useState("");
  const [activityTag, setActivityTag] = useState<string>("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [mapUrl, setMapUrl] = useState("");
  const [priceInr, setPriceInr] = useState("");
  const [priceUnit, setPriceUnit] = useState<PriceUnit>("per_hour");
  const [capacityMin, setCapacityMin] = useState(2);
  const [capacityMax, setCapacityMax] = useState(10);
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const isFree = priceInr.trim() === "";

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await createSpot({
        title,
        description,
        activity_tag: activityTag,
        address,
        map_url: mapUrl,
        price_inr: priceInr,
        price_unit: priceUnit,
        capacity_min: capacityMin,
        capacity_max: capacityMax,
        contact_phone: phone,
        contact_whatsapp: whatsapp,
        contact_email: email,
        photo_url: photoUrl,
      });
      if (res && !res.ok) setError(res.error);
    });
  }

  return (
    <div className="space-y-8 pb-24">
      <Field label="Spot name" hint="What people will see first.">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Champions Box Cricket"
        />
      </Field>

      <Field label="Activity">
        <div className="flex flex-wrap gap-2">
          {ACTIVITY_TAGS.map((t) => {
            const isActive = activityTag === t.slug;
            return (
              <button
                key={t.slug}
                type="button"
                onClick={() => setActivityTag(isActive ? "" : t.slug)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold transition-all active:scale-95",
                  isActive
                    ? "bg-primary-500 text-white"
                    : "bg-white border border-surface-border text-ink-secondary hover:border-primary-300",
                )}
              >
                <span className="material-symbols-outlined text-[16px]">
                  {t.icon}
                </span>
                {t.label}
              </button>
            );
          })}
        </div>
      </Field>

      <Field label="Short description" hint="2–3 lines, what's special about it.">
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Floodlit box-cricket with seating, lounge, bats & balls included."
          maxLength={400}
        />
      </Field>

      <div className="grid sm:grid-cols-2 gap-5">
        <Field label="Address">
          <Input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Sector 82, Mohali"
          />
        </Field>
        <Field label="Google Maps link (optional)">
          <Input
            value={mapUrl}
            onChange={(e) => setMapUrl(e.target.value)}
            placeholder="https://maps.app.goo.gl/…"
          />
        </Field>
      </div>

      <Field
        label="Price"
        hint="Leave blank for free / pay-at-venue spots."
      >
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted">
              ₹
            </span>
            <input
              type="number"
              min={0}
              value={priceInr}
              onChange={(e) => setPriceInr(e.target.value)}
              placeholder="1200"
              className="w-full bg-surface-low border border-surface-border rounded-2xl py-3 pl-8 pr-4 focus:ring-2 focus:ring-primary-300 focus:border-primary-400 outline-none text-base"
            />
          </div>
          <select
            value={priceUnit}
            onChange={(e) => setPriceUnit(e.target.value as PriceUnit)}
            disabled={isFree}
            className="bg-surface-low border border-surface-border rounded-2xl px-4 py-3 text-base disabled:opacity-50"
          >
            <option value="per_hour">per hour</option>
            <option value="per_person">per person</option>
            <option value="per_session">per session</option>
            <option value="flat">flat</option>
          </select>
        </div>
      </Field>

      <div className="grid sm:grid-cols-2 gap-5">
        <Field label="Min capacity">
          <Input
            type="number"
            min={1}
            value={capacityMin}
            onChange={(e) => setCapacityMin(Number(e.target.value || 1))}
          />
        </Field>
        <Field label="Max capacity">
          <Input
            type="number"
            min={capacityMin}
            value={capacityMax}
            onChange={(e) => setCapacityMax(Number(e.target.value || 1))}
          />
        </Field>
      </div>

      <Field label="Photo URL" hint="Use a public link (e.g. Unsplash, your IG, Google Drive share).">
        <Input
          value={photoUrl}
          onChange={(e) => setPhotoUrl(e.target.value)}
          placeholder="https://…"
        />
      </Field>

      <div className="grid sm:grid-cols-3 gap-5">
        <Field label="WhatsApp">
          <Input
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="+919876543210"
          />
        </Field>
        <Field label="Phone">
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+919876543210"
          />
        </Field>
        <Field label="Email">
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="host@spot.com"
          />
        </Field>
      </div>

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <button
        type="button"
        onClick={submit}
        disabled={pending || !title.trim() || !activityTag}
        className="w-full h-[56px] bg-primary-500 text-white font-bold text-base rounded-full sun-kissed-shadow hover:bg-primary-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {pending ? "Publishing…" : "Publish spot"}
      </button>
      <p className="text-center text-xs text-ink-muted">
        You can edit or hide this spot any time.
      </p>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <div className="flex items-baseline justify-between gap-3 px-1">
        <label className="text-sm font-semibold text-ink">{label}</label>
        {hint ? (
          <span className="text-xs text-ink-muted">{hint}</span>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "w-full bg-surface-low border border-surface-border rounded-2xl py-3 px-5 focus:ring-2 focus:ring-primary-300 focus:border-primary-400 outline-none transition-all text-base placeholder:text-ink-light",
        props.className,
      )}
    />
  );
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        "w-full bg-surface-low border border-surface-border rounded-2xl py-3 px-5 focus:ring-2 focus:ring-primary-300 focus:border-primary-400 outline-none transition-all text-base placeholder:text-ink-light resize-none",
        props.className,
      )}
    />
  );
}
