import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/ui/Avatar";

const ICON_TINTS = [
  { bg: "bg-peach",        text: "text-primary-700" },
  { bg: "bg-lilac",        text: "text-[#6A4BC2]" },
  { bg: "bg-sage",         text: "text-[#3C5A2E]" },
  { bg: "bg-sky",          text: "text-[#2A4A6B]" },
];

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export async function RightRail({
  currentUserId,
  cityId,
}: {
  currentUserId: string;
  cityId: string | null;
}) {
  const supabase = await createClient();

  // Top 3 trending communities (most members) the user hasn't joined
  let commQuery = supabase
    .from("communities")
    .select("id, slug, name, member_count, icon")
    .eq("is_active", true)
    .order("member_count", { ascending: false })
    .limit(10);
  if (cityId) commQuery = commQuery.or(`city_id.eq.${cityId},city_id.is.null`);

  // 3 candidate "next match" profiles in the user's city (excluding self)
  let candidatesQuery = supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, vibe_tags")
    .eq("is_onboarded", true)
    .neq("id", currentUserId)
    .limit(6);
  if (cityId) candidatesQuery = candidatesQuery.eq("current_city_id", cityId);

  const [{ data: memberships }, { data: communityData }, { data: candidates }] =
    await Promise.all([
      supabase
        .from("community_members")
        .select("community_id")
        .eq("profile_id", currentUserId),
      commQuery,
      candidatesQuery,
    ]);

  const joinedIds = new Set((memberships ?? []).map((m) => m.community_id));

  type CommunityRow = {
    id: string;
    slug: string;
    name: string;
    member_count: number;
    icon: string | null;
  };
  const trending = ((communityData as CommunityRow[]) ?? [])
    .filter((c) => !joinedIds.has(c.id))
    .slice(0, 3);

  type Candidate = {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
    vibe_tags: string[];
  };
  const nextCandidates = ((candidates as Candidate[]) ?? []).slice(0, 3);

  // Compute a simple shared-interest blurb for the dark card
  const { data: me } = await supabase
    .from("profiles")
    .select("vibe_tags")
    .eq("id", currentUserId)
    .single<{ vibe_tags: string[] }>();
  const myVibes = me?.vibe_tags ?? [];
  let sharedVibe: string | null = null;
  for (const v of myVibes) {
    if (nextCandidates.some((c) => c.vibe_tags?.includes(v))) {
      sharedVibe = v;
      break;
    }
  }

  return (
    <aside className="hidden xl:flex flex-col gap-6 w-80 shrink-0 sticky top-20 self-start max-h-[calc(100vh-5rem)] overflow-y-auto py-4 no-scrollbar">
      {/* Trending addas */}
      <section className="bg-white rounded-3xl p-6 sun-kissed-shadow">
        <h4 className="font-display text-xl font-semibold text-ink mb-4">
          trending addas
        </h4>
        {trending.length === 0 ? (
          <p className="text-sm text-ink-muted">
            You&apos;ve joined all the local ones already.
          </p>
        ) : (
          <ul className="flex flex-col gap-4">
            {trending.map((c, i) => {
              const tint = ICON_TINTS[i % ICON_TINTS.length];
              return (
                <li key={c.id}>
                  <Link
                    href={`/communities/${c.slug}`}
                    className="flex items-center gap-3 group"
                  >
                    <div
                      className={`w-12 h-12 rounded-2xl ${tint.bg} ${tint.text} grid place-items-center font-bold text-sm group-hover:scale-110 transition-transform`}
                    >
                      {initials(c.name)}
                    </div>
                    <div className="min-w-0">
                      <h5 className="text-sm font-bold text-ink line-clamp-1">
                        {c.name}
                      </h5>
                      <p className="text-[11px] text-ink-muted">
                        {c.member_count} members
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
        <Link
          href="/communities"
          className="block w-full mt-6 py-3 rounded-full border border-surface-border text-ink-secondary font-bold text-sm text-center hover:bg-surface-muted transition-colors"
        >
          explore more
        </Link>
      </section>

      {/* Dark "who's next" */}
      <section className="relative bg-surface-dark rounded-3xl p-6 overflow-hidden sun-kissed-shadow">
        <div className="absolute -bottom-12 -right-12 w-40 h-40 bg-primary-500/20 rounded-full blur-2xl" />
        <h4 className="font-display text-xl font-semibold text-white mb-2">
          who&apos;s next?
        </h4>
        <p className="text-white/60 text-sm mb-5">
          {sharedVibe
            ? `${nextCandidates.length} people nearby share your interest in "${sharedVibe}".`
            : `${nextCandidates.length} people nearby could be your next match.`}
        </p>
        {nextCandidates.length > 0 ? (
          <div className="flex -space-x-4 mb-6">
            {nextCandidates.map((c) => (
              <div
                key={c.id}
                className="w-12 h-12 rounded-full border-2 border-surface-dark overflow-hidden"
              >
                <Avatar
                  name={c.display_name}
                  src={c.avatar_url}
                  seed={c.id}
                  size="md"
                />
              </div>
            ))}
          </div>
        ) : null}
        <Link
          href="/match"
          className="block bg-mango-400 text-mango-700 font-bold w-full py-3 rounded-full text-center"
        >
          see potential matches
        </Link>
      </section>
    </aside>
  );
}
