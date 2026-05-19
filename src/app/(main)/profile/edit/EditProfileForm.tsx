"use client";

import { useState, useTransition } from "react";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { VibeTag } from "@/components/ui/VibeTag";
import type { City, Profile } from "@/lib/types";
import { VIBE_OPTIONS } from "@/lib/config";
import { updateProfile } from "./actions";

export function EditProfileForm({
  profile,
  cities,
}: {
  profile: Profile;
  cities: City[];
}) {
  const [displayName, setDisplayName] = useState(profile.display_name);
  const [bio, setBio] = useState(profile.bio ?? "");
  const [currentCity, setCurrentCity] = useState(profile.current_city_id ?? "");
  const [hometown, setHometown] = useState(profile.hometown_city_id ?? "");
  const [profession, setProfession] = useState(profile.profession ?? "");
  const [company, setCompany] = useState(profile.company ?? "");
  const [vibes, setVibes] = useState<string[]>(profile.vibe_tags ?? []);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggleVibe(v: string) {
    setVibes((current) =>
      current.includes(v)
        ? current.filter((x) => x !== v)
        : current.length < 8
        ? [...current, v]
        : current,
    );
  }

  function save() {
    setError(null);
    if (displayName.trim().length < 2) return setError("Tell us your name");
    if (!currentCity || !hometown) return setError("Pick your cities");
    if (profession.trim().length < 2) return setError("What do you do?");
    if (vibes.length < 3) return setError("Pick at least 3 vibes");

    startTransition(async () => {
      const res = await updateProfile({
        display_name: displayName,
        bio,
        current_city_id: currentCity,
        hometown_city_id: hometown,
        profession,
        company,
        vibe_tags: vibes,
      });
      if (res && !res.ok) setError(res.error);
    });
  }

  return (
    <div className="space-y-6">
      <Field label="Your name">
        <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
      </Field>

      <Field label="Bio" hint={`${bio.length}/160`}>
        <Textarea
          maxLength={160}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Frontend dev, gym rat, terrible at mornings ☕"
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Lives in">
          <CitySelect cities={cities} value={currentCity} onChange={setCurrentCity} />
        </Field>
        <Field label="From">
          <CitySelect cities={cities} value={hometown} onChange={setHometown} />
        </Field>
      </div>

      <Field label="What you do">
        <Input
          value={profession}
          onChange={(e) => setProfession(e.target.value)}
          placeholder="Frontend dev"
        />
      </Field>

      <Field label="Where (optional)">
        <Input
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          placeholder="Razorpay, freelance…"
        />
      </Field>

      <Field label="Your vibes" hint={`${vibes.length} picked · min 3, max 8`}>
        <div className="flex flex-wrap gap-2">
          {VIBE_OPTIONS.map((v) => (
            <VibeTag
              key={v}
              label={v}
              active={vibes.includes(v)}
              onClick={() => toggleVibe(v)}
            />
          ))}
        </div>
      </Field>

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <div className="flex justify-end gap-2 pt-2">
        <Button onClick={save} loading={pending}>
          Save
        </Button>
      </div>
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

function CitySelect({
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
      className="h-11 w-full rounded-2xl border border-surface-border bg-surface-elevated px-4 text-base text-ink focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
    >
      <option value="" disabled>
        Pick a city
      </option>
      {cities.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}, {c.state}
        </option>
      ))}
    </select>
  );
}
