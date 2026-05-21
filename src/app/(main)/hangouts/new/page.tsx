import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  CreateHangoutForm,
  type PrefilledListing,
} from "@/components/hangouts/CreateHangoutForm";

export default async function NewHangoutPage({
  searchParams,
}: {
  searchParams: Promise<{ listing?: string }>;
}) {
  const { listing: listingId } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: me } = await supabase
    .from("profiles")
    .select("current_city_id")
    .eq("id", user.id)
    .single<{ current_city_id: string | null }>();

  let prefill: PrefilledListing | null = null;
  if (listingId) {
    const { data } = await supabase
      .from("host_listings")
      .select(
        "id, title, activity_tag, address, price_inr, price_unit, capacity_max, photo_url",
      )
      .eq("id", listingId)
      .eq("is_active", true)
      .maybeSingle<PrefilledListing>();
    prefill = data ?? null;
  }

  return (
    <div className="flex gap-12">
      <div className="flex-1 max-w-2xl">
        <Link
          href={prefill ? `/spots/${prefill.id}` : "/hangouts"}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-muted hover:text-primary-600 mb-8 group transition-colors"
        >
          <span className="material-symbols-outlined text-[20px] group-hover:-translate-x-0.5 transition-transform">
            arrow_back
          </span>
          {prefill ? "back to spot" : "back to hangouts"}
        </Link>

        <header className="mb-10">
          <h1 className="font-serif text-3xl md:text-4xl font-semibold tracking-tight text-ink leading-tight mb-2">
            plan a hangout
          </h1>
          <p className="text-base italic text-ink-muted">
            {prefill
              ? `at ${prefill.title} — pick a date and crew size, we'll do the rest.`
              : "30 seconds. keep it casual."}
          </p>
        </header>

        <CreateHangoutForm
          cityId={me?.current_city_id ?? null}
          prefilledListing={prefill}
        />
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
                Pick an activity first — we&apos;ll suggest spots automatically.
              </Tip>
              <Tip n="02." rotation="rotate-3">
                Specific spots help people say yes faster than vague locations.
              </Tip>
              <Tip n="03." rotation="-rotate-3">
                You can also browse{" "}
                <Link
                  href="/spots"
                  className="text-primary-600 font-semibold underline"
                >
                  spots
                </Link>{" "}
                first and plan around one.
              </Tip>
            </ul>
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
