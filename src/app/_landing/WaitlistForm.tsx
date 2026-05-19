"use client";

import { useState, useTransition } from "react";
import { joinWaitlist } from "@/app/actions/waitlist";

type Variant = "hero" | "cta";

export function WaitlistForm({
  variant = "hero",
  source,
}: {
  variant?: Variant;
  source: string;
}) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<null | { alreadyOn: boolean }>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await joinWaitlist({ email, source });
      if (!res.ok) setError(res.error);
      else {
        setDone({ alreadyOn: !!res.alreadyOn });
        setEmail("");
      }
    });
  }

  if (done) {
    return (
      <p className="text-body-sm text-on-surface-variant">
        {done.alreadyOn
          ? "You're already on the list — we'll be in touch."
          : "You're in. Watch your inbox — we invite in small batches."}
      </p>
    );
  }

  const isHero = variant === "hero";

  return (
    <form
      onSubmit={submit}
      className={
        isHero
          ? "flex flex-col sm:flex-row gap-4 max-w-md"
          : "flex flex-col sm:flex-row gap-4 justify-center items-center"
      }
    >
      <div className={isHero ? "flex-1 relative" : "w-full sm:w-auto"}>
        <input
          required
          type="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={isHero ? "Your best email..." : "Your work email address"}
          className={
            isHero
              ? "w-full h-[52px] rounded-full border border-border-soft bg-surface-card/60 backdrop-blur px-6 focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none"
              : "h-[56px] w-full sm:w-[360px] rounded-full border border-border-soft bg-surface-container-low px-8 shadow-inner focus:ring-2 focus:ring-primary focus:bg-white transition-all outline-none text-center sm:text-left"
          }
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className={
          isHero
            ? "h-[52px] px-10 bg-primary text-on-primary rounded-full font-semibold text-[14px] hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-60"
            : "h-[56px] px-12 bg-ink-dark text-white rounded-full font-semibold text-[14px] hover:bg-primary hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-60"
        }
      >
        {pending ? "Saving…" : isHero ? "Save My Seat" : "Request Invite"}
      </button>
      {error ? (
        <p className="text-[12px] text-danger sm:absolute sm:-bottom-6">{error}</p>
      ) : null}
    </form>
  );
}
