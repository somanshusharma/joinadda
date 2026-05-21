import { Suspense } from "react";
import Link from "next/link";
import { Skeleton } from "@/components/shared/Skeleton";
import { GreetingBlock } from "./sections/GreetingBlock";
import { TonightHero } from "./sections/TonightHero";
import { TripsThisWeekend } from "./sections/TripsThisWeekend";
import { HangoutsPreview } from "./sections/HangoutsPreview";
import { FeedPreview } from "./sections/FeedPreview";
import { DailyMatchSection } from "./sections/DailyMatchSection";
import { LiveRoomsPlaceholder } from "./sections/LiveRoomsPlaceholder";
import { WhosAround } from "./sections/WhosAround";
import { WelcomeModal } from "./WelcomeModal";
import { SignUpCta } from "@/components/shared/SignUpCta";

export function HomeDashboard({
  userId,
  firstName,
  cityId,
  streakCount = 0,
}: {
  userId: string | null;
  firstName: string | null;
  cityId: string | null;
  streakCount?: number;
}) {
  const isGuest = !userId;
  return (
    <div className="space-y-12">
      {!isGuest ? <WelcomeModal /> : null}
      <GreetingBlock
        firstName={firstName}
        isGuest={isGuest}
        streakCount={streakCount}
      />

      <Suspense fallback={<Skeleton className="h-44 rounded-3xl" />}>
        <TonightHero cityId={cityId} userId={userId} />
      </Suspense>

      <Suspense fallback={<Skeleton className="h-24 rounded-3xl" />}>
        <WhosAround cityId={cityId} excludeUserId={userId} />
      </Suspense>

      <Section
        title="trips this weekend"
        href="/trips"
        subtitle="Escape the city with fellow explorers."
      >
        <Suspense fallback={<HorizontalSkeleton />}>
          <TripsThisWeekend cityId={cityId} />
        </Suspense>
      </Section>

      {!isGuest ? (
        <Section title="daily match" href="/match">
          <Suspense fallback={<Skeleton className="h-56 rounded-3xl" />}>
            <DailyMatchSection userId={userId} />
          </Suspense>
        </Section>
      ) : (
        <Section title="daily match">
          <GuestMatchTeaser />
        </Section>
      )}

      <Section title="people want to hang" href="/hangouts">
        <Suspense fallback={<Skeleton className="h-32 rounded-2xl" />}>
          <HangoutsPreview cityId={cityId} userId={userId} />
        </Suspense>
      </Section>

      <Section title="adda buzz today" href="/feed">
        <Suspense fallback={<Skeleton className="h-32 rounded-3xl" />}>
          <FeedPreview userId={userId} />
        </Suspense>
      </Section>

      <Section title="live communities right now">
        <LiveRoomsPlaceholder />
      </Section>
    </div>
  );
}

function GuestMatchTeaser() {
  return (
    <div className="rounded-3xl bg-gradient-to-br from-peach via-mango-300/40 to-primary-100 p-8 text-center sun-kissed-shadow">
      <p className="font-sticker text-lg text-primary-700 mb-2 -rotate-2 inline-block">
        one person a day
      </p>
      <h3 className="font-serif text-2xl md:text-3xl font-semibold text-ink leading-tight mb-3">
        JoinAdda picks someone you&apos;d actually click with.
      </h3>
      <p className="text-sm text-ink-secondary mb-5 max-w-md mx-auto">
        Sign up to get a daily friend suggestion based on your city, hometown
        and vibe. No swiping, no pressure.
      </p>
      <SignUpCta label="Get your first match" next="/match" />
    </div>
  );
}

function Section({
  title,
  subtitle,
  href,
  children,
}: {
  title: string;
  subtitle?: string;
  href?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-baseline justify-between gap-3 mb-4">
        <div className="min-w-0">
          <h2 className="font-display text-xl md:text-2xl font-semibold text-ink">
            {title}
          </h2>
          {subtitle ? (
            <p className="text-sm text-ink-muted mt-1">{subtitle}</p>
          ) : null}
        </div>
        {href ? (
          <Link
            href={href}
            className="text-xs font-semibold text-primary-600 hover:underline whitespace-nowrap"
          >
            see all →
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function HorizontalSkeleton() {
  return (
    <div className="flex gap-4 overflow-x-auto no-scrollbar">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-64 w-72 shrink-0 rounded-3xl" />
      ))}
    </div>
  );
}
