import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "For hosts — list your trips & hangouts free",
  description:
    "JoinAdda gives cafes, trek operators, and event organisers free distribution to working professionals in Tricity. No fee, no commission, just bookings.",
};

const PERKS = [
  {
    icon: "savings",
    title: "Free, forever",
    body: "No listing fee. No commission on bookings. You keep 100% of what your guests pay you.",
  },
  {
    icon: "groups",
    title: "Our crowd is your crowd",
    body: "Working professionals 24–35 in Chandigarh, Mohali, Panchkula — exactly the people who fill weekend trips and weekday cafes.",
  },
  {
    icon: "verified",
    title: "Verified host badge",
    body: "After your first successful event, you get a blue tick + priority placement in the feed and discover.",
  },
  {
    icon: "campaign",
    title: "We help you fill seats",
    body: "Featured hosts get a slot in our weekly digest, homepage carousel, and co-branded Instagram Reels.",
  },
  {
    icon: "chat",
    title: "Direct chat with guests",
    body: "No middlemen. Your guests reach you directly through the platform, just like WhatsApp.",
  },
  {
    icon: "schedule",
    title: "5 minutes to list",
    body: "We sit with you on the first listing — photo, dates, price, done. Or do it yourself in 5 mins.",
  },
];

const STEPS = [
  {
    n: 1,
    title: "Reach out",
    body: "Email hello@joinadda.com or WhatsApp us. Tell us a bit about what you host.",
  },
  {
    n: 2,
    title: "We set you up",
    body: "We create your host profile, verify you, and help you publish your first listing — no fee, no paperwork.",
  },
  {
    n: 3,
    title: "Guests find you",
    body: "Your trip or hangout goes live across the platform. Guests RSVP and chat you directly.",
  },
  {
    n: 4,
    title: "You host. We share.",
    body: "You deliver a great experience. We feature your best stories in our weekly digest. Win-win.",
  },
];

const FAQ = [
  {
    q: "Do I pay anything?",
    a: "No. Listing, verified badge, featured slots — everything is free during our launch phase. If we ever introduce paid tiers, you'll be grandfathered into the free plan.",
  },
  {
    q: "Do you take a cut of my bookings?",
    a: "Zero commission. Guests pay you directly — through UPI, your own payment link, or in person. We don't touch the money.",
  },
  {
    q: "Do I have to leave Meetup / Insta / BookMyShow?",
    a: "Not at all. JoinAdda is additive. List with us alongside whatever else you're using. We're not exclusive.",
  },
  {
    q: "What if I'm just an individual organising a one-off trip?",
    a: "Welcome — that's exactly who we're for too. You don't need to be a registered business to host.",
  },
  {
    q: "Which cities are you in?",
    a: "Starting in Chandigarh, Mohali, and Panchkula. We'll expand to Delhi NCR and Bengaluru once Tricity is humming.",
  },
];

export default function ForHostsPage() {
  return (
    <div className="max-w-3xl mx-auto">
      {/* Hero */}
      <section className="text-center py-10 md:py-14">
        <span className="inline-block rounded-full bg-primary-100 text-primary-700 text-xs font-bold tracking-wider uppercase px-3 py-1 mb-5">
          For hosts & partners
        </span>
        <h1 className="font-serif text-4xl md:text-5xl font-semibold tracking-tight text-ink leading-tight">
          Free distribution to Tricity&apos;s
          <br />
          working professionals.
        </h1>
        <p className="mt-5 text-lg text-ink-secondary max-w-xl mx-auto leading-relaxed">
          Cafes, trek operators, comedy clubs, coworking spaces — list your
          trips and hangouts on JoinAdda. No fee. No commission. Just bookings.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="mailto:hello@joinadda.com?subject=I'd%20like%20to%20host%20on%20JoinAdda"
            className="inline-flex items-center justify-center gap-2 h-12 px-7 rounded-full bg-primary-500 text-white font-semibold shadow-md hover:bg-primary-600 active:scale-[0.98] transition"
          >
            <span className="material-symbols-outlined text-[20px]">mail</span>
            Email us to get listed
          </a>
          <Link
            href="/trips"
            className="inline-flex items-center justify-center gap-2 h-12 px-7 rounded-full border border-surface-border text-ink-secondary font-semibold hover:bg-surface-muted transition"
          >
            See how listings look
          </Link>
        </div>
      </section>

      {/* Perks */}
      <section className="mt-4">
        <div className="grid sm:grid-cols-2 gap-3">
          {PERKS.map((p) => (
            <div
              key={p.title}
              className="bg-white border border-surface-border rounded-2xl p-5"
            >
              <div className="size-10 rounded-full bg-primary-100 text-primary-600 grid place-items-center mb-3">
                <span className="material-symbols-outlined text-[22px]">
                  {p.icon}
                </span>
              </div>
              <h3 className="font-display text-lg font-bold text-ink">
                {p.title}
              </h3>
              <p className="mt-1 text-sm text-ink-secondary leading-relaxed">
                {p.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mt-14">
        <h2 className="font-serif text-3xl font-semibold tracking-tight text-ink text-center">
          How it works
        </h2>
        <ol className="mt-8 space-y-4">
          {STEPS.map((s) => (
            <li
              key={s.n}
              className="flex gap-4 bg-white border border-surface-border rounded-2xl p-5"
            >
              <div className="size-9 shrink-0 rounded-full bg-primary-500 text-white font-bold grid place-items-center">
                {s.n}
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-ink">
                  {s.title}
                </h3>
                <p className="mt-1 text-sm text-ink-secondary leading-relaxed">
                  {s.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* FAQ */}
      <section className="mt-14">
        <h2 className="font-serif text-3xl font-semibold tracking-tight text-ink text-center">
          Quick questions
        </h2>
        <div className="mt-6 space-y-3">
          {FAQ.map((f) => (
            <details
              key={f.q}
              className="group bg-white border border-surface-border rounded-2xl p-5 open:shadow-sm"
            >
              <summary className="cursor-pointer flex items-center justify-between gap-3 font-semibold text-ink list-none">
                {f.q}
                <span className="material-symbols-outlined text-ink-muted transition-transform group-open:rotate-180">
                  expand_more
                </span>
              </summary>
              <p className="mt-3 text-sm text-ink-secondary leading-relaxed">
                {f.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="mt-14 mb-10 text-center bg-white border border-surface-border rounded-3xl p-8 md:p-12 sun-kissed-shadow">
        <h2 className="font-serif text-3xl font-semibold tracking-tight text-ink">
          Ready to host?
        </h2>
        <p className="mt-3 text-ink-secondary max-w-md mx-auto">
          Tell us about what you do — we&apos;ll get you listed in under 24
          hours.
        </p>
        <a
          href="mailto:hello@joinadda.com?subject=I'd%20like%20to%20host%20on%20JoinAdda"
          className="mt-6 inline-flex items-center justify-center gap-2 h-12 px-7 rounded-full bg-primary-500 text-white font-semibold shadow-md hover:bg-primary-600 active:scale-[0.98] transition"
        >
          <span className="material-symbols-outlined text-[20px]">mail</span>
          hello@joinadda.com
        </a>
      </section>
    </div>
  );
}
