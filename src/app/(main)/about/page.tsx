import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About JoinAdda",
  description:
    "JoinAdda is a community platform for working professionals in Indian cities to find their people — weekend trips, hangouts, and good company.",
};

export default function AboutPage() {
  return (
    <div className="max-w-2xl mx-auto py-6">
      <span className="inline-block rounded-full bg-primary-100 text-primary-700 text-xs font-bold tracking-wider uppercase px-3 py-1 mb-5">
        About us
      </span>
      <h1 className="font-serif text-4xl md:text-5xl font-semibold tracking-tight text-ink leading-tight">
        Hey, we&apos;re JoinAdda.
      </h1>
      <p className="mt-5 text-lg text-ink-secondary leading-relaxed">
        Working professionals in Indian cities spend their weekdays in offices
        and their weekends on Instagram. Meeting new people is harder than it
        used to be — apps are noisy, groups are dead, and Meetup never quite
        worked for us.
      </p>

      <p className="mt-4 text-lg text-ink-secondary leading-relaxed">
        JoinAdda is our attempt at fixing that. A casual, slightly chaotic, very
        Indian space to find your tribe — through weekend trips, spontaneous
        hangouts, shared vibes, and communities you actually care about.
      </p>

      <h2 className="mt-12 font-serif text-2xl font-semibold tracking-tight text-ink">
        What we believe
      </h2>
      <ul className="mt-4 space-y-3 text-ink-secondary leading-relaxed">
        <li className="flex gap-3">
          <span className="material-symbols-outlined text-primary-600 shrink-0">
            check_circle
          </span>
          <span>
            <strong className="text-ink">Crowd attracts crowd.</strong> The
            internet works best when real people show up.
          </span>
        </li>
        <li className="flex gap-3">
          <span className="material-symbols-outlined text-primary-600 shrink-0">
            check_circle
          </span>
          <span>
            <strong className="text-ink">Free for the long haul.</strong> Hosts
            don&apos;t pay us. Users don&apos;t pay us. Period.
          </span>
        </li>
        <li className="flex gap-3">
          <span className="material-symbols-outlined text-primary-600 shrink-0">
            check_circle
          </span>
          <span>
            <strong className="text-ink">Offline &gt; online.</strong> The whole
            point is to get off the app and into the same café.
          </span>
        </li>
        <li className="flex gap-3">
          <span className="material-symbols-outlined text-primary-600 shrink-0">
            check_circle
          </span>
          <span>
            <strong className="text-ink">Safety first.</strong> Verified
            profiles, reports, blocks — we take this seriously.
          </span>
        </li>
      </ul>

      <h2 className="mt-12 font-serif text-2xl font-semibold tracking-tight text-ink">
        The team
      </h2>
      <p className="mt-4 text-ink-secondary leading-relaxed">
        Built out of Chandigarh by a tiny team that ran out of weekend plans and
        decided to do something about it.
      </p>

      <h2 className="mt-12 font-serif text-2xl font-semibold tracking-tight text-ink">
        Say hi
      </h2>
      <p className="mt-4 text-ink-secondary leading-relaxed">
        Hosting a trip or a hangout?{" "}
        <Link
          href="/for-hosts"
          className="text-primary-600 font-semibold hover:underline"
        >
          List it free →
        </Link>
      </p>
      <p className="mt-2 text-ink-secondary leading-relaxed">
        Press, partnerships, or just a hello —{" "}
        <a
          href="mailto:hello@joinadda.com"
          className="text-primary-600 font-semibold hover:underline"
        >
          hello@joinadda.com
        </a>
      </p>

      <div className="mt-12 bg-white border border-surface-border rounded-3xl p-6 md:p-8 sun-kissed-shadow">
        <p className="font-sticker text-xl text-primary-700 -rotate-1 inline-block">
          made in india, with chai ☕
        </p>
      </div>
    </div>
  );
}
