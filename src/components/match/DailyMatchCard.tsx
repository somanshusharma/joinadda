"use client";

import { useTransition, useState } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { skipDailyMatch, sayHiToMatch } from "@/app/actions/match";

export type DailyMatchView = {
  match_id: string;
  reason: string;
  action: "pending" | "skipped" | "said_hi";
  candidate: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
    profession: string | null;
    bio: string | null;
    vibe_tags: string[];
  };
};

const VIBE_TINTS = [
  { bg: "bg-sky/60", text: "text-[#2D4A63]" },
  { bg: "bg-lilac/60", text: "text-[#4A3D63]" },
  { bg: "bg-peach/60", text: "text-[#802A00]" },
  { bg: "bg-surface-container", text: "text-ink-secondary" },
];

export function DailyMatchCard({ match }: { match: DailyMatchView }) {
  const [skipped, setSkipped] = useState(match.action === "skipped");
  const [pendingSkip, startSkip] = useTransition();
  const [pendingHi, startHi] = useTransition();

  function onSkip() {
    setSkipped(true);
    startSkip(async () => {
      const res = await skipDailyMatch(match.match_id);
      if (!res.ok) setSkipped(false);
    });
  }

  function onSayHi() {
    startHi(async () => {
      await sayHiToMatch(match.match_id, match.candidate.id);
    });
  }

  if (skipped) {
    return (
      <div className="rounded-[32px] bg-surface-muted p-8 sun-kissed-shadow text-center">
        <p className="text-sm text-ink-secondary">
          Skipped. We&apos;ll find someone new tomorrow.
        </p>
      </div>
    );
  }

  const c = match.candidate;

  return (
    <div className="bg-white rounded-[32px] p-6 md:p-8 sun-kissed-shadow relative overflow-hidden">
      {/* Handwritten sticker on desktop */}
      <span className="hidden md:block absolute top-6 right-8 font-sticker text-primary-600 -rotate-6 text-lg">
        Picked for you!
      </span>

      {/* Profile header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="rounded-full border-2 border-peach shrink-0">
          <Avatar
            name={c.display_name}
            src={c.avatar_url}
            seed={c.id}
            size="lg"
          />
        </div>
        <div className="min-w-0">
          <Link
            href={`/profile/${c.username}`}
            className="block font-display text-xl font-semibold text-ink leading-tight hover:underline truncate"
          >
            {c.display_name}
          </Link>
          {c.profession ? (
            <p className="text-xs font-medium text-ink-muted uppercase tracking-wider mt-1">
              {c.profession}
            </p>
          ) : null}
        </div>
      </div>

      {/* Commonality pill */}
      <div className="inline-flex items-center bg-peach/40 px-4 py-1.5 rounded-full mb-5 gap-2">
        <span className="material-symbols-outlined text-primary-700 text-[18px]">
          colors
        </span>
        <span className="text-sm font-medium text-primary-700">
          {match.reason}
        </span>
      </div>

      {/* Bio */}
      {c.bio ? (
        <p className="text-base text-ink-secondary leading-relaxed mb-7 max-w-xl">
          {c.bio}
        </p>
      ) : null}

      {/* Vibe tags */}
      {c.vibe_tags?.length ? (
        <div className="flex flex-wrap gap-2 mb-8">
          {c.vibe_tags.slice(0, 6).map((v, i) => {
            const tint = VIBE_TINTS[i % VIBE_TINTS.length];
            return (
              <span
                key={v}
                className={`${tint.bg} ${tint.text} px-4 py-1.5 rounded-full text-sm font-medium`}
              >
                {v}
              </span>
            );
          })}
        </div>
      ) : null}

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onSkip}
          disabled={pendingSkip}
          className="py-3 px-6 rounded-full font-semibold text-sm text-ink-secondary hover:bg-surface-muted transition-colors active:scale-95 disabled:opacity-50"
        >
          Skip
        </button>
        <button
          type="button"
          onClick={onSayHi}
          disabled={pendingHi}
          className="bg-primary-500 text-white py-3 px-6 rounded-full text-sm font-bold sun-kissed-shadow hover:bg-primary-600 active:scale-95 transition-all flex justify-center items-center gap-2 disabled:opacity-50"
        >
          Say hi 👋
        </button>
      </div>
    </div>
  );
}
