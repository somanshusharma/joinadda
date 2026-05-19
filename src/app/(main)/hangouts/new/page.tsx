import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CreateHangoutForm } from "@/components/hangouts/CreateHangoutForm";

export default async function NewHangoutPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="flex gap-12">
      <div className="flex-1 max-w-2xl">
        <Link
          href="/hangouts"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-muted hover:text-primary-600 mb-8 group transition-colors"
        >
          <span className="material-symbols-outlined text-[20px] group-hover:-translate-x-0.5 transition-transform">
            arrow_back
          </span>
          back to hangouts
        </Link>

        <header className="mb-10">
          <h1 className="font-serif text-3xl md:text-4xl font-semibold tracking-tight text-ink leading-tight mb-2">
            plan a hangout
          </h1>
          <p className="text-base italic text-ink-muted">
            30 seconds. keep it casual.
          </p>
        </header>

        <CreateHangoutForm />
      </div>

      {/* Pro tips rail */}
      <aside className="hidden xl:block w-72 shrink-0">
        <div className="sticky top-24 space-y-6">
          <div className="bg-white p-6 rounded-3xl sun-kissed-shadow border border-surface-border relative overflow-hidden">
            <div className="absolute -top-4 -right-4 w-20 h-20 bg-mango-300/30 rounded-full blur-2xl" />
            <h3 className="font-display text-lg font-semibold text-ink mb-5 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary-600">
                lightbulb
              </span>
              pro tips
            </h3>
            <ul className="space-y-5">
              <Tip n="01." rotation="-rotate-6">
                Keep the title short. &ldquo;Coffee at Blue Tokai&rdquo; beats
                &ldquo;i am bored let&apos;s meet&rdquo;.
              </Tip>
              <Tip n="02." rotation="rotate-3">
                Specific spots help people say yes faster than vague locations.
              </Tip>
              <Tip n="03." rotation="-rotate-3">
                Casual hangouts (chai, walks) have 3x higher join rates.
              </Tip>
            </ul>
            <div className="mt-8 p-4 bg-sky rounded-2xl">
              <p className="text-[13px] font-medium text-ink leading-snug">
                &ldquo;I met my current co-founder at a simple Sunday walk
                hangout.&rdquo;
              </p>
              <p className="text-[11px] text-ink-muted mt-2">
                — Preeti, Bangalore
              </p>
            </div>
          </div>

          <div className="p-6 text-center border-2 border-dashed border-surface-border rounded-3xl">
            <span className="material-symbols-outlined text-ink-muted text-3xl mb-2">
              volunteer_activism
            </span>
            <p className="text-sm text-ink-muted">
              Hangouts are always free for everyone.
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}

function Tip({
  n,
  rotation,
  children,
}: {
  n: string;
  rotation: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-3">
      <span
        className={`shrink-0 font-sticker text-lg text-primary-600 transform ${rotation}`}
      >
        {n}
      </span>
      <p className="text-sm text-ink-secondary leading-relaxed">{children}</p>
    </li>
  );
}
