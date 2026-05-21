import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CreateSpotForm } from "@/components/spots/CreateSpotForm";

export default async function NewSpotPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/spots/new");

  const { data: me } = await supabase
    .from("profiles")
    .select("can_add_spots, is_admin")
    .eq("id", user.id)
    .single<{ can_add_spots: boolean; is_admin: boolean }>();

  // Hide the page completely from unauthorised users — looks like it
  // doesn't exist rather than "you can't access this".
  if (!me?.can_add_spots && !me?.is_admin) notFound();

  return (
    <div className="max-w-2xl">
      <Link
        href="/spots"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-muted hover:text-primary-600 mb-6 group transition-colors"
      >
        <span className="material-symbols-outlined text-[20px] group-hover:-translate-x-0.5 transition-transform">
          arrow_back
        </span>
        all spots
      </Link>

      <header className="mb-8">
        <h1 className="font-serif text-3xl md:text-4xl font-semibold tracking-tight text-ink leading-tight mb-2">
          add a spot
        </h1>
        <p className="text-base text-ink-secondary">
          A place people can plan a hangout around — your cafe, turf, studio,
          trek route, anything.
        </p>
      </header>

      <CreateSpotForm />
    </div>
  );
}
