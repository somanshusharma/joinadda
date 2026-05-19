import { SignUpCta } from "@/components/shared/SignUpCta";

function getTimeOfDay(): string {
  const now = new Date();
  const hour = now.getHours();
  const dow = now.getDay();
  const dayName = now.toLocaleDateString(undefined, { weekday: "long" });

  if ((dow === 5 || dow === 6) && hour >= 16) return `${dayName} night`;
  if (hour < 11) return `${dayName} morning`;
  if (hour < 16) return `${dayName} afternoon`;
  if (hour < 20) return `${dayName} evening`;
  return `${dayName} night`;
}

function headlineFor(firstName: string) {
  const now = new Date();
  const hour = now.getHours();
  const dow = now.getDay();
  if (dow === 0 || dow === 6) return `weekend mood, ${firstName}?`;
  if (hour < 11) return `morning, ${firstName} — what's the plan today?`;
  if (hour < 16) return `what's the plan, ${firstName}?`;
  return `what's the plan tonight, ${firstName}?`;
}

export function GreetingBlock({
  firstName,
  isGuest = false,
  streakCount = 0,
}: {
  firstName: string | null;
  isGuest?: boolean;
  streakCount?: number;
}) {
  const subtitle = getTimeOfDay().toUpperCase();

  if (isGuest || !firstName) {
    return (
      <section className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.15em] text-primary-600 mb-2">
            {subtitle}
          </p>
          <h1 className="font-serif text-[34px] md:text-5xl font-semibold tracking-tight text-ink leading-[1.05]">
            find your people, minus the fakeness.
          </h1>
          <p className="mt-3 text-base md:text-lg text-ink-secondary max-w-xl">
            A cozy spot for working folks in Indian cities. Browse hangouts,
            trips and gossip — and join the adda to RSVP and chat.
          </p>
        </div>
        <div className="shrink-0">
          <SignUpCta label="Join the adda" size="lg" />
        </div>
      </section>
    );
  }

  const heading = headlineFor(firstName.toLowerCase());
  return (
    <section>
      <div className="flex items-center gap-3 mb-2">
        <p className="text-xs font-medium uppercase tracking-[0.15em] text-primary-600">
          {subtitle}
        </p>
        {streakCount > 1 ? (
          <span className="inline-flex items-center gap-1.5 bg-mango-400/40 text-mango-700 px-2.5 py-1 rounded-full text-[11px] font-bold">
            <span>🔥</span>
            day {streakCount}
          </span>
        ) : null}
      </div>
      <h1 className="font-serif text-[34px] md:text-5xl font-semibold tracking-tight text-ink leading-[1.05]">
        {heading}
      </h1>
      <p className="mt-3 text-base md:text-lg text-ink-secondary">
        {streakCount >= 3
          ? `${streakCount} days of showing up. Keep going.`
          : "The weekend is almost here. Your crew is already plotting."}
      </p>
    </section>
  );
}
