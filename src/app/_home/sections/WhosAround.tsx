import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/ui/Avatar";

const WINDOW_MIN = 15;

type PresenceRow = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
};

export async function WhosAround({
  cityId,
  excludeUserId,
}: {
  cityId: string | null;
  excludeUserId: string | null;
}) {
  const supabase = await createClient();
  const since = new Date(Date.now() - WINDOW_MIN * 60 * 1000).toISOString();

  let query = supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url")
    .eq("is_onboarded", true)
    .gte("last_seen_at", since)
    .order("last_seen_at", { ascending: false })
    .limit(10);

  if (cityId) query = query.eq("current_city_id", cityId);
  if (excludeUserId) query = query.neq("id", excludeUserId);

  const { data } = await query;
  const people = (data as PresenceRow[]) ?? [];

  if (people.length === 0) {
    return (
      <div className="rounded-3xl bg-surface-muted/60 border border-surface-border p-5 flex items-center gap-3">
        <span className="material-symbols-outlined text-ink-muted">
          schedule
        </span>
        <p className="text-sm text-ink-muted">
          Pretty quiet right now. Be the one who starts something.
        </p>
      </div>
    );
  }

  const visible = people.slice(0, 5);
  const overflow = Math.max(0, people.length - visible.length);

  return (
    <Link
      href="/discover"
      className="block rounded-3xl bg-white border border-surface-border p-5 sun-kissed-shadow hover:-translate-y-1 transition-transform"
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="relative grid size-2 place-items-center">
          <span className="absolute inset-0 rounded-full bg-success animate-ping opacity-50" />
          <span className="relative size-2 rounded-full bg-success" />
        </span>
        <span className="text-[11px] font-bold uppercase tracking-wide text-success">
          Around right now
        </span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex -space-x-3">
          {visible.map((p) => (
            <div
              key={p.id}
              className="rounded-full ring-2 ring-white"
              title={p.display_name}
            >
              <Avatar
                name={p.display_name}
                src={p.avatar_url}
                seed={p.id}
                size="md"
              />
            </div>
          ))}
          {overflow > 0 ? (
            <span className="size-10 rounded-full ring-2 ring-white bg-surface-muted grid place-items-center text-xs font-bold text-ink-secondary">
              +{overflow}
            </span>
          ) : null}
        </div>
        <p className="text-sm text-ink-secondary leading-tight">
          <span className="font-bold text-ink">
            {people.length} {people.length === 1 ? "person" : "people"}
          </span>{" "}
          in your city are active. Say hi →
        </p>
      </div>
    </Link>
  );
}
