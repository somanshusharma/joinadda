import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/ui/Avatar";

type HangoutHostRow = {
  host_id: string;
  host: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
  } | null;
};

export async function TopHosts({ cityId }: { cityId: string | null }) {
  const supabase = await createClient();
  const since = new Date(
    Date.now() - 30 * 24 * 60 * 60 * 1000,
  ).toISOString();

  let q = supabase
    .from("hangouts")
    .select(
      "host_id, host:host_id(id, username, display_name, avatar_url)",
    )
    .gte("created_at", since)
    .limit(200);
  if (cityId) q = q.eq("city_id", cityId);

  const { data } = await q;
  const rows = (data as unknown as HangoutHostRow[]) ?? [];

  // Tally hangouts per host.
  const counts = new Map<
    string,
    { count: number; host: NonNullable<HangoutHostRow["host"]> }
  >();
  for (const r of rows) {
    if (!r.host) continue;
    const existing = counts.get(r.host_id);
    if (existing) existing.count += 1;
    else counts.set(r.host_id, { count: 1, host: r.host });
  }

  const top = [...counts.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  if (top.length === 0) return null;

  return (
    <section className="rounded-3xl border border-surface-border bg-white p-6 sun-kissed-shadow">
      <div className="flex items-baseline justify-between mb-4">
        <h4 className="font-display text-lg font-semibold text-ink">
          this month&apos;s top hosts
        </h4>
        <span className="font-sticker text-base text-primary-600 -rotate-2">
          mvps 🙌
        </span>
      </div>
      <ul className="space-y-3">
        {top.map((row, i) => (
          <li key={row.host.id}>
            <Link
              href={`/profile/${row.host.username}`}
              className="flex items-center gap-3 group"
            >
              <span className="w-6 text-center font-display text-sm font-bold text-ink-muted">
                {i + 1}
              </span>
              <Avatar
                name={row.host.display_name}
                src={row.host.avatar_url}
                seed={row.host.id}
                size="sm"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink truncate group-hover:text-primary-700 transition-colors">
                  {row.host.display_name}
                </p>
                <p className="text-xs text-ink-muted">
                  {row.count} hangout{row.count === 1 ? "" : "s"} hosted
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
