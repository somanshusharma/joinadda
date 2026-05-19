"use client";

import { useMemo, useState, useTransition } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import type { City, EventType } from "@/lib/types";
import { createEvent } from "@/app/actions/event";
import { cn } from "@/lib/utils";

const TYPES: { key: EventType; label: string; hint: string }[] = [
  { key: "hangout", label: "Hangout", hint: "Cafe, dinner, gig night" },
  { key: "trip", label: "Trip", hint: "Weekend trek, road trip" },
  { key: "workcation", label: "Workcation", hint: "Work-from-anywhere with the crew" },
  { key: "community_event", label: "Community meetup", hint: "For a specific community" },
];

const TOTAL = 5;

export function CreateEventForm({
  cities,
  defaultCityId,
  communities,
}: {
  cities: City[];
  defaultCityId: string | null;
  communities: { id: string; name: string }[];
}) {
  const initialCity = useMemo(
    () => defaultCityId ?? cities[0]?.id ?? "",
    [cities, defaultCityId],
  );

  const [step, setStep] = useState(1);
  const [type, setType] = useState<EventType>("hangout");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [location, setLocation] = useState("");
  const [cityId, setCityId] = useState(initialCity);
  const [maxAttendees, setMaxAttendees] = useState<number>(12);
  const [costInr, setCostInr] = useState<number>(0);
  const [costNotes, setCostNotes] = useState("");
  const [communityId, setCommunityId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function next() {
    setError(null);
    const err = validate(step);
    if (err) return setError(err);
    setStep((s) => Math.min(TOTAL, s + 1));
  }

  function back() {
    setError(null);
    setStep((s) => Math.max(1, s - 1));
  }

  function validate(s: number): string | null {
    if (s === 2) {
      if (title.trim().length < 3) return "Pick a clear title";
      if (description.trim().length < 10) return "Add a few words of context";
    }
    if (s === 3) {
      if (!startsAt) return "When's it happening?";
    }
    if (s === 4) {
      if (!location.trim()) return "Where's it happening?";
      if (!cityId) return "Pick a city";
    }
    return null;
  }

  function publish() {
    setError(null);
    for (let s = 1; s <= 4; s++) {
      const err = validate(s);
      if (err) {
        setStep(s);
        setError(err);
        return;
      }
    }
    startTransition(async () => {
      const res = await createEvent({
        type,
        title,
        description,
        cover_image_url: coverUrl.trim() || null,
        city_id: cityId,
        community_id: communityId || null,
        location,
        starts_at: new Date(startsAt).toISOString(),
        ends_at: endsAt ? new Date(endsAt).toISOString() : null,
        max_attendees: maxAttendees,
        cost_per_person_inr: costInr,
        cost_notes: costNotes || null,
      });
      if (res && !res.ok) setError(res.error);
    });
  }

  return (
    <div>
      <Stepper current={step} total={TOTAL} />

      {step === 1 && (
        <Section title="What kind of plan?" subtitle="Pick a vibe — you can tweak later.">
          <div className="grid gap-2 sm:grid-cols-2">
            {TYPES.map((t) => {
              const active = t.key === type;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setType(t.key)}
                  className={cn(
                    "rounded-2xl border p-4 text-left transition",
                    active
                      ? "border-primary-500 bg-primary-50"
                      : "border-surface-border bg-surface-elevated hover:border-primary-200",
                  )}
                >
                  <p className="font-semibold text-ink">{t.label}</p>
                  <p className="mt-1 text-xs text-ink-muted">{t.hint}</p>
                </button>
              );
            })}
          </div>
        </Section>
      )}

      {step === 2 && (
        <Section title="What's the plan?" subtitle="Give it a title and a vibe.">
          <Field label="Title">
            <Input
              value={title}
              maxLength={80}
              placeholder="Sunday morning trek to Kasauli"
              onChange={(e) => setTitle(e.target.value)}
            />
          </Field>
          <Field label="What's the plan?" hint={`${description.length}/500`}>
            <Textarea
              value={description}
              maxLength={500}
              placeholder="Easy 6km trail, leaving Mohali at 6am. We'll grab parathas on the way."
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-32"
            />
          </Field>
          <Field label="Cover image URL (optional)">
            <Input
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
              placeholder="https://…"
            />
          </Field>
        </Section>
      )}

      {step === 3 && (
        <Section title="When?" subtitle="Pick a date and time.">
          <Field label="Starts">
            <Input
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
            />
          </Field>
          <Field label="Ends (optional)">
            <Input
              type="datetime-local"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
            />
          </Field>
        </Section>
      )}

      {step === 4 && (
        <Section title="Where?" subtitle="Drop a location people will recognize.">
          <Field label="Location">
            <Input
              value={location}
              placeholder="Cafe Lota, Sector 8"
              onChange={(e) => setLocation(e.target.value)}
            />
          </Field>
          <Field label="City">
            <select
              value={cityId}
              onChange={(e) => setCityId(e.target.value)}
              className="h-11 w-full rounded-2xl border border-surface-border bg-surface-elevated px-4 text-base text-ink focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
            >
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}, {c.state}
                </option>
              ))}
            </select>
          </Field>
        </Section>
      )}

      {step === 5 && (
        <Section title="Last bits" subtitle="Crew size, cost, and where to post it.">
          <Field label={`How many people? ${maxAttendees}`}>
            <input
              type="range"
              min={4}
              max={50}
              value={maxAttendees}
              onChange={(e) => setMaxAttendees(Number(e.target.value))}
              className="w-full accent-[var(--color-primary-500)]"
            />
          </Field>
          <Field label="Cost per person (₹)">
            <Input
              type="number"
              min={0}
              value={costInr}
              onChange={(e) => setCostInr(Number(e.target.value) || 0)}
            />
            <p className="mt-1 text-xs text-ink-muted">Set to 0 if it&apos;s free.</p>
          </Field>
          {costInr > 0 ? (
            <Field label="Cost notes (optional)">
              <Textarea
                value={costNotes}
                maxLength={200}
                placeholder="Covers fuel + breakfast. Pay the organizer on the day."
                onChange={(e) => setCostNotes(e.target.value)}
              />
            </Field>
          ) : null}
          {communities.length > 0 ? (
            <Field label="Post to a community (optional)">
              <select
                value={communityId}
                onChange={(e) => setCommunityId(e.target.value)}
                className="h-11 w-full rounded-2xl border border-surface-border bg-surface-elevated px-4 text-base text-ink focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
              >
                <option value="">No community — just the city feed</option>
                {communities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
          ) : null}
        </Section>
      )}

      {error ? <p className="mt-4 text-sm text-danger">{error}</p> : null}

      <div className="mt-8 flex items-center justify-between gap-3">
        <Button variant="ghost" onClick={back} disabled={step === 1 || pending}>
          <ChevronLeft className="size-4" /> Back
        </Button>
        {step < TOTAL ? (
          <Button onClick={next}>
            Next <ChevronRight className="size-4" />
          </Button>
        ) : (
          <Button onClick={publish} loading={pending}>
            Publish
          </Button>
        )}
      </div>
    </div>
  );
}

function Stepper({ current, total }: { current: number; total: number }) {
  return (
    <div className="mb-6 flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={
            "h-1.5 flex-1 rounded-full " +
            (i < current ? "bg-primary-500" : "bg-surface-border")
          }
        />
      ))}
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="font-display text-xl font-extrabold tracking-tight">{title}</h2>
      {subtitle ? <p className="mt-1 text-ink-secondary">{subtitle}</p> : null}
      <div className="mt-5 space-y-4">{children}</div>
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
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="block text-sm font-semibold text-ink">{label}</span>
        {hint ? <span className="text-xs text-ink-muted">{hint}</span> : null}
      </div>
      {children}
    </div>
  );
}
