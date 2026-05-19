import Link from "next/link";
import { WaitlistForm } from "./WaitlistForm";

export default function Landing() {
  return (
    <div className="bg-surface-page text-on-surface min-h-screen font-landing">
      {/* Fonts + Material Symbols (scoped to landing) */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&display=swap"
      />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
      />
      <style>{`
        .font-outfit { font-family: 'Outfit', 'Inter', sans-serif; }
        .font-landing { font-family: 'Inter', system-ui, sans-serif; }
        .sunset-gradient {
          background:
            radial-gradient(circle at 70% 30%, rgba(255, 219, 206, 0.4) 0%, rgba(255, 248, 242, 0) 60%),
            radial-gradient(circle at 10% 80%, rgba(254, 166, 25, 0.15) 0%, rgba(255, 248, 242, 0) 50%);
        }
        .material-symbols-outlined {
          font-family: 'Material Symbols Outlined';
          font-weight: normal;
          font-style: normal;
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
          line-height: 1;
          letter-spacing: normal;
          text-transform: none;
          display: inline-block;
          white-space: nowrap;
          word-wrap: normal;
          direction: ltr;
        }
      `}</style>

      {/* Header */}
      <header className="bg-surface-page/80 backdrop-blur-md border-b border-[#EAE3D8] sticky top-0 z-50">
        <div className="flex justify-between items-center w-full px-5 md:px-8 h-20 max-w-7xl mx-auto">
          <Link
            href="/"
            className="text-2xl font-outfit font-bold text-primary-700 tracking-tight"
          >
            Adda
          </Link>
          <nav className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-semibold text-ink-secondary hover:text-ink px-3 py-2"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="text-sm font-semibold bg-primary-500 text-white hover:bg-primary-600 px-5 h-10 inline-flex items-center rounded-full transition"
            >
              I have an invite
            </Link>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden pt-16 pb-28 md:pt-32 md:pb-40 px-5 md:px-8 sunset-gradient">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="z-10">
              <div className="inline-flex items-center gap-2 bg-[#ffddb8]/60 text-[#653e00] px-5 py-1.5 rounded-full mb-8">
                <span className="material-symbols-outlined text-[18px]">
                  auto_awesome
                </span>
                <span className="text-[14px] font-semibold">
                  Join 500+ real people today
                </span>
              </div>
              <h1 className="font-outfit text-[44px] sm:text-[52px] md:text-[72px] leading-[1.05] text-ink mb-8 tracking-tight font-bold">
                Find your people, minus the fakeness.
              </h1>
              <p className="text-base md:text-[16px] leading-relaxed text-ink-secondary max-w-lg mb-12 opacity-90">
                A cozy spot for Indian professionals to make real friends, plan
                trips, and hang out. Like a chai-stall conversation, but for
                your career and life.
              </p>
              <WaitlistForm variant="hero" source="hero" />
              <div className="mt-6 flex items-center gap-2 px-1">
                <span className="w-2 h-2 rounded-full bg-accent-400 animate-pulse" />
                <p className="text-[12px] text-ink-muted">
                  Invitations are personally reviewed to keep the vibe right.
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -top-12 -right-12 w-80 h-80 bg-[#ffddb8] opacity-40 rounded-full blur-3xl" />
              <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-primary-100 opacity-50 rounded-full blur-3xl" />
              <div className="relative bg-white/40 backdrop-blur-sm p-5 rounded-3xl shadow-2xl rotate-2 border border-white/50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://images.unsplash.com/photo-1543007630-9710e4a00a20?w=900&q=80&auto=format&fit=crop"
                  alt="Friends laughing over chai at a cafe"
                  className="w-full h-[360px] md:h-[450px] rounded-2xl object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Bento features */}
        <section className="py-28 bg-surface-muted/50 px-5 md:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-20 text-center max-w-3xl mx-auto">
              <h2 className="font-outfit text-3xl md:text-5xl text-ink mb-6 font-bold leading-tight">
                No bots, no boastful posts,
                <br />
                just good vibes.
              </h2>
              <p className="text-base md:text-[16px] text-ink-secondary leading-relaxed">
                We built the features we wish LinkedIn had, designed for the way
                we actually connect back home.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Feature 1 — City & Hometown */}
              <div className="md:col-span-7 bg-white rounded-3xl p-8 border border-[#EAE3D8] flex flex-col justify-between relative hover:shadow-xl transition-shadow duration-500">
                <div className="relative z-10">
                  <span className="inline-flex p-4 rounded-full bg-primary-100 text-primary-700 mb-8">
                    <span className="material-symbols-outlined">
                      diversity_3
                    </span>
                  </span>
                  <h3 className="font-outfit text-2xl font-bold text-ink mb-3">
                    City & Hometown Communities
                  </h3>
                  <p className="text-[16px] text-ink-secondary max-w-sm leading-relaxed">
                    Find people from your roots. Whether you&apos;re a Puneri in
                    Bangalore or a Malayali in Delhi, find your tribe instantly.
                  </p>
                </div>
                <div className="mt-12 relative h-56 overflow-hidden rounded-2xl border border-[#EAE3D8] bg-surface-muted/40">
                  <div className="absolute inset-0 bg-gradient-to-tr from-primary-100/40 to-accent-100/60" />
                  <div className="relative p-8 flex flex-wrap gap-3">
                    {[
                      { t: "#BengaluruTechies", c: "text-primary-700" },
                      { t: "#DelhiGupShup", c: "text-amber-800" },
                      { t: "#PuneFoodies", c: "text-ink" },
                      { t: "#MumbaiCreatives", c: "text-primary-700" },
                      { t: "#HyderabadCoders", c: "text-amber-800" },
                    ].map((p) => (
                      <span
                        key={p.t}
                        className={`bg-white px-4 py-2 rounded-full shadow-sm text-[14px] font-medium ${p.c}`}
                      >
                        {p.t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Feature 2 — Trips & Hangouts (filled card) */}
              <div className="md:col-span-5 bg-primary-500 text-white rounded-3xl p-8 flex flex-col items-center text-center justify-center gap-8 hover:shadow-xl transition-shadow duration-500">
                <span
                  className="material-symbols-outlined text-[80px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  celebration
                </span>
                <div>
                  <h3 className="font-outfit text-2xl font-bold mb-3">
                    Trips & Hangouts
                  </h3>
                  <p className="text-[16px] opacity-90 px-4 leading-relaxed">
                    Strangers become friends over weekend treks, museum walks,
                    or just a shared café workday. Safe, verified, and fun.
                  </p>
                </div>
                <span className="bg-white text-primary-700 px-8 py-3 rounded-full font-semibold text-[14px] shadow-lg">
                  Explore Vibes
                </span>
              </div>

              {/* Feature 3 — Real Talk Feed */}
              <div className="md:col-span-5 bg-white rounded-3xl p-8 border border-[#EAE3D8] flex flex-col justify-between hover:shadow-xl transition-shadow duration-500">
                <div className="flex items-center justify-between mb-10">
                  <span className="inline-flex p-4 rounded-full bg-[#ffddb8] text-amber-800">
                    <span className="material-symbols-outlined">forum</span>
                  </span>
                  <div className="flex -space-x-3">
                    <div className="w-10 h-10 rounded-full border-2 border-white bg-emerald-200 grid place-items-center text-xs font-bold text-emerald-900 shadow-sm">
                      R
                    </div>
                    <div className="w-10 h-10 rounded-full border-2 border-white bg-sky-200 grid place-items-center text-xs font-bold text-sky-900 shadow-sm">
                      A
                    </div>
                    <div className="w-10 h-10 rounded-full border-2 border-white bg-primary-500 grid place-items-center text-[12px] font-bold text-white shadow-sm">
                      +12
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-outfit text-2xl font-bold text-ink mb-3">
                    Real Talk Feed
                  </h3>
                  <p className="text-[16px] text-ink-secondary leading-relaxed">
                    No &quot;humbled to announce,&quot; just banter, honest
                    career advice, and weekend plans. The feed that feels like a
                    real talk.
                  </p>
                </div>
              </div>

              {/* Feature 4 — Sample event card */}
              <div className="md:col-span-7 bg-white rounded-3xl p-8 border border-[#EAE3D8] relative overflow-hidden hover:shadow-xl transition-shadow duration-500">
                <div className="flex flex-col h-full justify-center">
                  <div className="flex items-center gap-5 mb-8">
                    <div className="w-14 h-14 rounded-2xl bg-[#ede3b8] grid place-items-center text-[#665f3d] shadow-sm">
                      <span className="material-symbols-outlined text-3xl">
                        coffee
                      </span>
                    </div>
                    <div>
                      <p className="font-outfit text-xl font-bold text-ink">
                        Vibe: Coffee & Code
                      </p>
                      <p className="text-[14px] text-ink-muted">
                        Indiranagar, Bangalore · Saturday 11 AM
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3 px-2">
                    <div className="h-2.5 bg-surface-muted rounded-full w-full" />
                    <div className="h-2.5 bg-surface-muted rounded-full w-4/5" />
                    <div className="h-2.5 bg-surface-muted rounded-full w-2/3" />
                  </div>
                  <div className="mt-10 flex items-center justify-between">
                    <span className="text-[14px] font-semibold text-success flex items-center gap-2">
                      <span
                        className="material-symbols-outlined text-[18px]"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        check_circle
                      </span>
                      12 People Joining
                    </span>
                    <span className="bg-surface-muted px-6 py-2.5 rounded-full text-[14px] font-semibold">
                      RSVP Now
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="py-32 px-5 md:px-8 bg-surface-page relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary-100/30 blur-[120px] rounded-full -z-0" />
          <div className="max-w-4xl mx-auto bg-white rounded-3xl p-12 md:p-20 text-center relative border border-[#EAE3D8] shadow-2xl">
            <div className="inline-block px-4 py-1 bg-[#ffddb8]/40 text-amber-800 font-semibold text-[11px] tracking-widest uppercase mb-8 rounded-full">
              Limited Guest Slots
            </div>
            <h2 className="font-outfit text-3xl md:text-5xl text-ink mb-8 font-bold leading-tight">
              Ready for a better professional social life?
            </h2>
            <p className="text-base md:text-[16px] text-ink-secondary mb-12 max-w-2xl mx-auto leading-relaxed">
              We&apos;re inviting people in small batches to ensure everyone
              actually gets to meet and make real connections. Want to be in
              our next cohort?
            </p>
            <WaitlistForm variant="cta" source="bottom-cta" />
            <p className="mt-8 text-[12px] text-ink-muted italic">
              It only takes 20 seconds. No obligation, just quality talk.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-surface-muted/30 border-t border-[#EAE3D8] pt-16 pb-12">
        <div className="flex flex-col md:flex-row justify-between items-center px-5 md:px-8 max-w-7xl mx-auto gap-8">
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="font-outfit text-2xl font-bold text-primary-700">
              Adda
            </div>
            <p className="text-[12px] text-ink-muted text-center md:text-left">
              © {new Date().getFullYear()} Adda.{" "}
              <br className="md:hidden" />
              Built with ❤️ for the Indian Professional.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-4">
            {["About Adda", "Community Rules", "Privacy", "Terms", "Support"].map(
              (label) => (
                <Link
                  key={label}
                  href="#"
                  className="text-[12px] text-ink-muted hover:text-primary-700 transition-colors font-medium"
                >
                  {label}
                </Link>
              ),
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
