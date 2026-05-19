"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Input, Textarea } from "@/components/ui/Input";
import { VibeTag } from "@/components/ui/VibeTag";
import type { City } from "@/lib/types";
import { VIBE_OPTIONS, DEFAULT_CITY_SLUG } from "@/lib/config";
import { cn } from "@/lib/utils";
import { completeOnboarding } from "./actions";

type State = {
  display_name: string;
  username: string;
  current_city_id: string;
  hometown_city_id: string;
  profession: string;
  company: string;
  show_company: boolean;
  bio: string;
  vibe_tags: string[];
};

const TOTAL_STEPS = 4;

const STEP_COPY: Record<number, { title: string; subtitle: string }> = {
  1: {
    title: "Almost home.",
    subtitle: "Just a few details so we can find your tribe. It'll only take a minute!",
  },
  2: {
    title: "Where you at?",
    subtitle: "We'll connect you with people from your hometown in your current city.",
  },
  3: {
    title: "What do you do?",
    subtitle: "Keep it casual. No need for fancy titles.",
  },
  4: {
    title: "Your vibe.",
    subtitle: "Pick at least 3, max 8. These help us find your kind of people.",
  },
};

export function OnboardingFlow({
  cities,
  initialUsername,
}: {
  cities: City[];
  initialUsername: string;
}) {
  const defaultCityId = useMemo(
    () => cities.find((c) => c.slug === DEFAULT_CITY_SLUG)?.id ?? cities[0]?.id ?? "",
    [cities],
  );

  const [step, setStep] = useState(1);
  const [state, setState] = useState<State>({
    display_name: "",
    username: initialUsername,
    current_city_id: defaultCityId,
    hometown_city_id: defaultCityId,
    profession: "",
    company: "",
    show_company: true,
    bio: "",
    vibe_tags: [],
  });
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function update<K extends keyof State>(key: K, value: State[K]) {
    setState((s) => ({ ...s, [key]: value }));
  }

  function next() {
    setError(null);
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  }

  function back() {
    setError(null);
    setStep((s) => Math.max(s - 1, 1));
  }

  function finish() {
    setError(null);
    startTransition(async () => {
      const res = await completeOnboarding({
        username: state.username,
        display_name: state.display_name,
        current_city_id: state.current_city_id,
        hometown_city_id: state.hometown_city_id,
        profession: state.profession,
        company: state.show_company && state.company ? state.company : null,
        bio: state.bio || null,
        vibe_tags: state.vibe_tags,
      });
      if (res && !res.ok) setError(res.error);
    });
  }

  const copy = STEP_COPY[step];

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4 py-10 md:px-6 md:py-16">
      {/* Floating brand */}
      <Link
        href="/"
        className="fixed top-6 left-6 hidden md:block text-2xl font-extrabold tracking-tight text-primary-600"
      >
        Adda
      </Link>

      <main className="w-full max-w-2xl">
        {/* Progress dots */}
        <div className="mb-10 flex flex-col items-center gap-4">
          <div className="flex items-center gap-3">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1.5 w-10 rounded-full transition-colors",
                  i < step ? "bg-primary-500" : "bg-surface-muted",
                )}
              />
            ))}
          </div>
          <span className="text-xs font-semibold tracking-wide text-ink-muted">
            Step {step} of {TOTAL_STEPS}
          </span>
        </div>

        {/* Card */}
        <div className="rounded-[2.5rem] bg-white border border-surface-border shadow-sm p-8 md:p-14">
          <div className="text-center mb-10 md:mb-12">
            <h1 className="text-[28px] md:text-[34px] font-semibold tracking-tight text-ink leading-tight mb-3">
              {copy.title}
            </h1>
            <p className="text-base text-ink-secondary max-w-md mx-auto leading-relaxed">
              {copy.subtitle}
            </p>
          </div>

          {step === 1 && (
            <div className="space-y-10">
              <AvatarSlot />
              <div className="space-y-7">
                <Field
                  label="What should we call you?"
                  htmlFor="display-name"
                >
                  <TallInput
                    id="display-name"
                    placeholder="Sachin Dev"
                    value={state.display_name}
                    onChange={(e) => update("display_name", e.target.value)}
                  />
                </Field>
                <Field
                  label="Pick a unique handle"
                  htmlFor="username"
                  hint="This is how friends will mention you in Addas."
                >
                  <div className="relative">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-base text-ink-muted">
                      @
                    </span>
                    <TallInput
                      id="username"
                      placeholder="sachin_dev"
                      value={state.username}
                      onChange={(e) =>
                        update("username", e.target.value.toLowerCase())
                      }
                      className="pl-12"
                    />
                  </div>
                </Field>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-7">
              <Field label="Where do you live now?">
                <CityPicker
                  cities={cities}
                  value={state.current_city_id}
                  onChange={(v) => update("current_city_id", v)}
                />
              </Field>
              <Field label="Where are you originally from?">
                <CityPicker
                  cities={cities}
                  value={state.hometown_city_id}
                  onChange={(v) => update("hometown_city_id", v)}
                />
              </Field>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-7">
              <Field label="What do you do?">
                <TallInput
                  placeholder="Frontend dev / PM / Designer / …"
                  value={state.profession}
                  onChange={(e) => update("profession", e.target.value)}
                />
              </Field>
              <Field label="Where? (optional)">
                <TallInput
                  placeholder="Razorpay, Zomato, freelance…"
                  value={state.company}
                  onChange={(e) => update("company", e.target.value)}
                />
                <label className="mt-3 flex items-center gap-2 text-sm text-ink-secondary px-1">
                  <input
                    type="checkbox"
                    checked={state.show_company}
                    onChange={(e) => update("show_company", e.target.checked)}
                    className="size-4 accent-[var(--color-primary-500)]"
                  />
                  Show on my profile
                </label>
              </Field>
              <Field
                label="Tell us about yourself in 2 lines"
                hint={`${state.bio.length}/160`}
              >
                <Textarea
                  maxLength={160}
                  placeholder="Frontend dev, gym rat, terrible at mornings ☕"
                  value={state.bio}
                  onChange={(e) => update("bio", e.target.value)}
                  className="!min-h-28 !rounded-2xl !py-4 !px-6"
                />
              </Field>
            </div>
          )}

          {step === 4 && (
            <div>
              <p className="mb-4 text-sm text-ink-muted text-center">
                Picked {state.vibe_tags.length} of 8
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {VIBE_OPTIONS.map((v) => {
                  const active = state.vibe_tags.includes(v);
                  return (
                    <VibeTag
                      key={v}
                      label={v}
                      active={active}
                      onClick={() => {
                        if (active) {
                          update(
                            "vibe_tags",
                            state.vibe_tags.filter((x) => x !== v),
                          );
                        } else if (state.vibe_tags.length < 8) {
                          update("vibe_tags", [...state.vibe_tags, v]);
                        }
                      }}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {error ? (
            <p className="mt-6 text-center text-sm text-danger">{error}</p>
          ) : null}

          <div className="mt-10 flex flex-col gap-3">
            {step < TOTAL_STEPS ? (
              <PrimaryBigButton onClick={next}>
                Continue
                <span className="material-symbols-outlined">chevron_right</span>
              </PrimaryBigButton>
            ) : (
              <PrimaryBigButton onClick={finish} disabled={pending}>
                {pending ? "Setting up your adda…" : "Let's go"}
                {!pending ? (
                  <span className="material-symbols-outlined">chevron_right</span>
                ) : null}
              </PrimaryBigButton>
            )}
            {step > 1 ? (
              <button
                type="button"
                onClick={back}
                disabled={pending}
                className="text-sm font-semibold text-ink-muted hover:text-ink py-2"
              >
                Back
              </button>
            ) : null}
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-ink-muted">
          Changed your mind?{" "}
          <Link
            href="/login"
            className="font-semibold text-primary-600 hover:underline"
          >
            Log in to existing account
          </Link>
        </p>
      </main>
    </div>
  );
}

function AvatarSlot() {
  // Visual-only placeholder; real upload comes with Supabase Storage wiring.
  return (
    <div className="flex flex-col items-center">
      <div className="relative group">
        <div className="w-[140px] h-[140px] rounded-full bg-surface-muted border-2 border-dashed border-surface-border flex items-center justify-center overflow-hidden transition-all group-hover:bg-primary-50 group-hover:border-primary-200">
          <span className="material-symbols-outlined text-5xl text-ink-light">
            face
          </span>
        </div>
        <button
          type="button"
          aria-label="Add photo (coming soon)"
          disabled
          className="absolute bottom-1 right-1 bg-primary-500 w-11 h-11 rounded-full flex items-center justify-center text-white shadow-xl opacity-60 cursor-not-allowed"
        >
          <span className="material-symbols-outlined text-[22px]">
            photo_camera
          </span>
        </button>
      </div>
      <span className="mt-5 text-sm font-semibold text-ink-muted">
        Photo upload coming soon
      </span>
    </div>
  );
}

function Field({
  label,
  hint,
  htmlFor,
  children,
}: {
  label: string;
  hint?: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-baseline justify-between px-1">
        <label
          htmlFor={htmlFor}
          className="text-sm font-semibold text-ink"
        >
          {label}
        </label>
        {hint ? <span className="text-xs text-ink-muted">{hint}</span> : null}
      </div>
      {children}
    </div>
  );
}

function TallInput({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Input
      {...props}
      className={cn(
        "!h-[60px] !rounded-2xl !px-6 !text-base bg-surface !border-surface-border focus:!ring-2 focus:!ring-primary-200 focus:!border-primary-400",
        className,
      )}
    />
  );
}

function CityPicker({
  cities,
  value,
  onChange,
}: {
  cities: City[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-[60px] w-full rounded-2xl border border-surface-border bg-surface px-6 text-base text-ink focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
    >
      {cities.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}, {c.state}
        </option>
      ))}
    </select>
  );
}

function PrimaryBigButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className="w-full h-[60px] bg-primary-500 text-white font-semibold text-base rounded-full shadow-md hover:shadow-lg hover:bg-primary-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
    >
      {children}
    </button>
  );
}
