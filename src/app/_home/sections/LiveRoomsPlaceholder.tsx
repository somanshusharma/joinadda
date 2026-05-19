import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const FEATURED = [
  {
    slug: "friday-night-plans",
    bg: "bg-peach/50",
    border: "border-peach",
    iconBg: "bg-primary-500",
    icon: "sports_cricket",
    snippet: "Kohli's cover drive is just… chef's kiss.",
  },
  {
    slug: "burnout-club",
    bg: "bg-sage/50",
    border: "border-sage",
    iconBg: "bg-tertiary-fixed-dim",
    icon: "coffee",
    snippet: "Just venting tbh. Therapy hours.",
  },
] as const;

export async function LiveRoomsPlaceholder() {
  const supabase = await createClient();
  const slugs = FEATURED.map((f) => f.slug);

  const { data: communities } = await supabase
    .from("communities")
    .select("id, slug, name")
    .in("slug", slugs);

  if (!communities || communities.length === 0) return null;

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const counts: Record<string, number> = {};
  for (const c of communities) {
    const { data } = await supabase
      .from("posts")
      .select("author_id")
      .eq("community_id", c.id)
      .gte("created_at", oneHourAgo);
    counts[c.id] = new Set((data ?? []).map((p) => p.author_id)).size;
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {communities.map((c) => {
        const meta = FEATURED.find((f) => f.slug === c.slug);
        if (!meta) return null;
        return (
          <Link
            key={c.id}
            href={`/communities/${c.slug}`}
            className={`${meta.bg} p-5 rounded-3xl border ${meta.border} block transition-transform hover:-translate-y-1`}
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="relative grid size-2 place-items-center">
                <span className="absolute inset-0 rounded-full bg-success animate-ping opacity-50" />
                <span className="relative size-2 rounded-full bg-success" />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wide text-ink-secondary">
                Live · {counts[c.id]} chatting
              </span>
            </div>
            <div
              className={`w-9 h-9 ${meta.iconBg} rounded-full grid place-items-center text-white mb-3`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {meta.icon}
              </span>
            </div>
            <h5 className="font-display text-base font-semibold text-ink leading-tight">
              {c.name}
            </h5>
            <p className="mt-1 text-xs text-ink-muted">{meta.snippet}</p>
          </Link>
        );
      })}
    </div>
  );
}
