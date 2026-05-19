import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell, type ShellUser } from "@/components/shared/AppShell";
import { HomeDashboard } from "./_home/HomeDashboard";
import { RightRail } from "@/components/feed/RightRail";
import { touchPresence } from "./actions/presence";
import {
  FirstHangoutModal,
  type WelcomeHangout,
} from "./_home/FirstHangoutModal";

export const metadata = {
  title: "JoinAdda — Meet, Travel, Hangout",
  description:
    "JoinAdda is a cozy spot for Indian professionals to meet, travel, and hang out. Like a chai-stall conversation, but for your career and life.",
};

type Profile = {
  username: string;
  display_name: string;
  avatar_url: string | null;
  is_onboarded: boolean;
  current_city_id: string | null;
  streak_count: number | null;
};

export default async function Root({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>;
}) {
  const { welcome } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let shellUser: ShellUser = null;
  let profile: Profile | null = null;
  let unread = 0;

  if (user) {
    const [profileRes, unreadRes, streakAfterTouch] = await Promise.all([
      supabase
        .from("profiles")
        .select(
          "username, display_name, avatar_url, is_onboarded, current_city_id, streak_count",
        )
        .eq("id", user.id)
        .maybeSingle<Profile>(),
      supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("recipient_id", user.id)
        .eq("is_read", false),
      touchPresence(user.id),
    ]);

    profile = profileRes.data;
    if (!profile?.is_onboarded) redirect("/onboarding");

    unread = unreadRes.count ?? 0;
    shellUser = {
      userId: user.id,
      displayName: profile.display_name,
      username: profile.username,
      avatarUrl: profile.avatar_url,
      unreadNotifications: unread,
      streakCount: streakAfterTouch ?? profile.streak_count ?? 0,
    };
  }

  // First-action modal: only for fresh signups landing here from /onboarding.
  let welcomeHangouts: WelcomeHangout[] = [];
  if (user && profile && welcome === "1") {
    let q = supabase
      .from("hangouts")
      .select(
        "id, activity, time_window, location, joiner_count, max_joiners, host:host_id(id, display_name, avatar_url)",
      )
      .eq("status", "open")
      .gt("expires_at", new Date().toISOString())
      .neq("host_id", user.id)
      .order("created_at", { ascending: false })
      .limit(3);
    if (profile.current_city_id) q = q.eq("city_id", profile.current_city_id);
    const { data } = await q;
    welcomeHangouts = (data as unknown as WelcomeHangout[]) ?? [];
  }

  return (
    <AppShell user={shellUser}>
      <div className="flex gap-8">
        <div className="flex-1 min-w-0">
          <HomeDashboard
            userId={user?.id ?? null}
            firstName={profile?.display_name?.split(" ")[0] ?? null}
            cityId={profile?.current_city_id ?? null}
            streakCount={shellUser?.streakCount ?? 0}
          />
        </div>
        {user && profile ? (
          <Suspense fallback={null}>
            <RightRail
              currentUserId={user.id}
              cityId={profile.current_city_id ?? null}
            />
          </Suspense>
        ) : null}
      </div>

      {welcome === "1" && user ? (
        <FirstHangoutModal hangouts={welcomeHangouts} />
      ) : null}
    </AppShell>
  );
}
