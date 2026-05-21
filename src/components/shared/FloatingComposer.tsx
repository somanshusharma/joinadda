import { createClient } from "@/lib/supabase/server";
import { PostComposer } from "@/components/feed/PostComposer";

export async function FloatingComposer() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Which communities the user is already a member of (shown first)
  const { data: memberships } = await supabase
    .from("community_members")
    .select("community_id")
    .eq("profile_id", user.id);
  const joinedIds = new Set(
    (memberships ?? []).map((m) => m.community_id as string),
  );

  // Fetch user's city for "in your city" sorting hint
  const { data: me } = await supabase
    .from("profiles")
    .select("current_city_id")
    .eq("id", user.id)
    .single<{ current_city_id: string | null }>();

  // All active communities — user can post to any. Joined ones float to top.
  const { data: all } = await supabase
    .from("communities")
    .select("id, name, city_id")
    .eq("is_active", true)
    .limit(100);

  const communities = (all ?? [])
    .map((c) => ({
      id: c.id as string,
      name: c.name as string,
      joined: joinedIds.has(c.id as string),
      sameCity: !!me?.current_city_id && c.city_id === me.current_city_id,
    }))
    .sort((a, b) => {
      // Joined first, then same city, then alphabetical
      if (a.joined !== b.joined) return a.joined ? -1 : 1;
      if (a.sameCity !== b.sameCity) return a.sameCity ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

  return <PostComposer communities={communities} />;
}
