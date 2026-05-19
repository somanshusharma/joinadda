import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { JoinHangoutButton } from "@/components/hangouts/JoinHangoutButton";
import { SignUpCta } from "@/components/shared/SignUpCta";

type HangoutRow = {
  id: string;
  activity: string;
  time_window: string;
  location: string;
  joiner_count: number;
  max_joiners: number;
  status: "open" | "full" | "happening" | "completed" | "cancelled";
  host: {
    id: string;
    username: string;
    display_name: string;
  } | null;
};

export async function HangoutsPreview({
  cityId,
  userId,
}: {
  cityId: string | null;
  userId: string | null;
}) {
  const supabase = await createClient();

  let q = supabase
    .from("hangouts")
    .select(
      "id, activity, time_window, location, joiner_count, max_joiners, status, host:host_id(id, username, display_name)",
    )
    .eq("status", "open")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(3);
  if (cityId) q = q.eq("city_id", cityId);

  const [{ data: hangoutsData }, joinedRes] = await Promise.all([
    q,
    userId
      ? supabase
          .from("hangout_joiners")
          .select("hangout_id")
          .eq("profile_id", userId)
      : Promise.resolve({ data: [] as { hangout_id: string }[] }),
  ]);

  const hangouts = (hangoutsData as unknown as HangoutRow[]) ?? [];
  const joinedIds = new Set((joinedRes.data ?? []).map((j) => j.hangout_id));

  if (hangouts.length === 0) {
    return (
      <div className="bg-peach/40 rounded-3xl border border-peach/60 p-6">
        <p className="text-sm text-ink-secondary">
          Nobody&apos;s asked yet — be the first.
        </p>
        <Link
          href="/hangouts/new"
          className="mt-3 inline-flex bg-primary-500 text-white font-bold text-sm px-5 py-2.5 rounded-full"
        >
          Plan a hangout
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {hangouts.map((h) => {
        const firstName = h.host?.display_name.split(" ")[0] ?? "Someone";
        return (
          <div
            key={h.id}
            className="bg-white rounded-2xl p-5 sun-kissed-shadow border border-surface-muted flex items-center justify-between gap-3"
          >
            <Link href={`/hangouts/${h.id}`} className="min-w-0 flex-1">
              <h5 className="font-display text-base font-semibold text-ink leading-snug truncate">
                {firstName} wants to{" "}
                <span className="text-primary-600">{h.activity}</span>
              </h5>
              <p className="text-xs text-ink-muted mt-1">
                {h.location} · {h.time_window}
              </p>
            </Link>
            {userId ? (
              <JoinHangoutButton
                hangoutId={h.id}
                initialJoined={joinedIds.has(h.id)}
                isFull={h.joiner_count >= h.max_joiners}
                isHost={h.host?.id === userId}
                isCancelled={h.status === "cancelled"}
                size="sm"
              />
            ) : (
              <SignUpCta
                label="I'm in"
                size="sm"
                next={`/hangouts/${h.id}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
