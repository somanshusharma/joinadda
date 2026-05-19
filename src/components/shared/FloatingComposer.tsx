import { createClient } from "@/lib/supabase/server";
import { PostComposer } from "@/components/feed/PostComposer";

export async function FloatingComposer() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("community_members")
    .select("community:community_id(id, name)")
    .eq("profile_id", user.id);

  const communities = (data ?? [])
    .map(
      (r) =>
        r.community as unknown as { id: string; name: string } | null,
    )
    .filter((c): c is { id: string; name: string } => c !== null);

  return <PostComposer communities={communities} />;
}
