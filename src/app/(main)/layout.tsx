import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell, type ShellUser } from "@/components/shared/AppShell";
import { touchPresence } from "@/app/actions/presence";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let shellUser: ShellUser = null;

  if (user) {
    const [{ data: profile }, { count: unread }, streakAfterTouch] =
      await Promise.all([
        supabase
          .from("profiles")
          .select(
            "username, display_name, avatar_url, is_onboarded, streak_count",
          )
          .eq("id", user.id)
          .maybeSingle<{
            username: string;
            display_name: string;
            avatar_url: string | null;
            is_onboarded: boolean;
            streak_count: number | null;
          }>(),
        supabase
          .from("notifications")
          .select("*", { count: "exact", head: true })
          .eq("recipient_id", user.id)
          .eq("is_read", false),
        // Touch presence + streak in parallel. Returns the resulting streak.
        touchPresence(user.id),
      ]);

    if (!profile?.is_onboarded) redirect("/onboarding");

    shellUser = {
      userId: user.id,
      displayName: profile.display_name,
      username: profile.username,
      avatarUrl: profile.avatar_url,
      unreadNotifications: unread ?? 0,
      streakCount: streakAfterTouch ?? profile.streak_count ?? 0,
    };
  }

  return <AppShell user={shellUser}>{children}</AppShell>;
}
