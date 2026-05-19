"use client";

import { useState, useTransition } from "react";
import { createHangout } from "@/app/actions/hangout";
import { cn } from "@/lib/utils";

type SuggestionChip = { label: string; emoji: string };

const ACTIVITY_SUGGESTIONS: SuggestionChip[] = [
  { label: "Grab coffee", emoji: "☕" },
  { label: "Watch a movie", emoji: "🎬" },
  { label: "Trek", emoji: "🥾" },
  { label: "Workout", emoji: "💪" },
  { label: "Study together", emoji: "📚" },
  { label: "Lunch", emoji: "🍱" },
  { label: "Play cricket", emoji: "🏏" },
  { label: "Cafe-hop", emoji: "🥐" },
];

type WhenKey = "tonight" | "tomorrow" | "this weekend" | "next week" | "pick a date";
const WHEN_OPTIONS: WhenKey[] = [
  "tonight",
  "tomorrow",
  "this weekend",
  "next week",
  "pick a date",
];

export function CreateHangoutForm() {
  const [activity, setActivity] = useState("");
  const [whenKey, setWhenKey] = useState<WhenKey>("this weekend");
  const [customDate, setCustomDate] = useState("");
  const [location, setLocation] = useState("");
  const [maxJoiners, setMaxJoiners] = useState(4);
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await createHangout({
        activity,
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
        location,
        max_joiners: maxJoiners,
      });
      if (res && !res.ok) setError(res.error);
    });
  }

  return (
    <div className="space-y-12 pb-32 md:pb-12">
      {/* What */}
      <Section label="What do you want to do?">
        <input
          type="text"
          value={activity}
          onChange={(e) => setActivity(e.target.value)}
          placeholder="e.g. catch up over some filter coffee"
          className="w-full bg-surface-low border border-surface-border rounded-2xl py-4 px-6 focus:ring-2 focus:ring-primary-300 focus:border-primary-400 outline-none sun-kissed-shadow transition-all text-base placeholder:text-ink-light"
        />
        <div className="flex flex-wrap gap-2 pt-3">
          {ACTIVITY_SUGGESTIONS.map((s) => {
            const isActive = activity === s.label;
            return (
              <button
                key={s.label}
                type="button"
                onClick={() => setActivity(s.label)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-semibold transition-all active:scale-95",
                  isActive
                    ? "bg-primary-500 text-white"
                    : "bg-white border border-surface-border text-ink-secondary hover:border-primary-300",
                )}
              >
                <span className="mr-1">{s.emoji}</span>
                {s.label}
              </button>
            );
          })}
        </div>
      </Section>

      {/* When */}
      <Section label="When?">
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4 md:mx-0 md:px-0">
          {WHEN_OPTIONS.map((opt) => {
            const isActive = whenKey === opt;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => setWhenKey(opt)}
                className={cn(
                  "shrink-0 px-6 py-3 rounded-2xl text-sm font-semibold transition-all",
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
            className="mt-3 w-full bg-surface-low border border-surface-border rounded-2xl py-4 px-6 focus:ring-2 focus:ring-primary-300 focus:border-primary-400 outline-none text-base"
          />
        ) : null}
      </Section>

      {/* Where */}
      <Section label="Where?">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted">
            location_on
          </span>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Sector 26 Mohali, or 'anywhere in Mohali'"
            className="w-full bg-surface-low border border-surface-border rounded-2xl py-4 pl-12 pr-6 focus:ring-2 focus:ring-primary-300 focus:border-primary-400 outline-none sun-kissed-shadow transition-all text-base placeholder:text-ink-light"
          />
        </div>
      </Section>

      {/* How many */}
      <section className="space-y-4">
        <div className="flex justify-between items-end px-1">
          <label className="text-sm font-semibold text-ink-secondary">
            How many people?
          </label>
          <span className="font-display text-2xl font-semibold text-primary-600 transition-transform">
            {maxJoiners}
          </span>
        </div>
        <div className="px-2">
          <input
            type="range"
            min={2}
            max={10}
            value={maxJoiners}
            onChange={(e) => setMaxJoiners(Number(e.target.value))}
            className="adda-range w-full"
          />
          <div className="flex justify-between mt-2 text-[10px] text-ink-muted font-medium uppercase tracking-widest">
            <span>min 2</span>
            <span>max 10</span>
          </div>
        </div>
      </section>

      {/* Details */}
      <Section label="Any details? (optional)">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Split bills equally, bringing my pet dog!"
          rows={3}
          maxLength={300}
          className="w-full bg-surface-low border border-surface-border rounded-2xl py-4 px-6 focus:ring-2 focus:ring-primary-300 focus:border-primary-400 outline-none sun-kissed-shadow transition-all text-base placeholder:text-ink-light resize-none"
        />
      </Section>

      {error ? (
        <p className="text-sm text-danger -mt-6">{error}</p>
      ) : null}

      {/* Inline submit on desktop, sticky on mobile (handled by parent layout) */}
      <div className="hidden md:block pt-2">
        <button
          type="button"
          onClick={submit}
          disabled={pending}
          className="w-full h-[60px] bg-primary-500 text-white font-bold text-base rounded-full sun-kissed-shadow hover:bg-primary-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {pending ? "Posting…" : "post hangout"}
          {!pending ? (
            <span className="material-symbols-outlined">send</span>
          ) : null}
        </button>
        <p className="text-center mt-4 text-ink-muted text-sm">
          Your network will be notified. No pressure for them to join.
        </p>
      </div>

      {/* Sticky bottom CTA on mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 p-5 bg-surface/80 backdrop-blur-xl">
        <button
          type="button"
          onClick={submit}
          disabled={pending}
          className="w-full h-14 bg-primary-500 text-white rounded-full font-bold text-base sun-kissed-shadow active:scale-95 transition-all hover:bg-primary-600 disabled:opacity-60"
        >
          {pending ? "Posting…" : "post hangout"}
        </button>
      </div>

      {/* Range slider thumb styling (scoped) */}
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
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <label className="block text-sm font-semibold text-ink-secondary px-1">
        {label}
      </label>
      {children}
    </section>
  );
}
