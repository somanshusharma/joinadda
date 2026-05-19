"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type CreatePostInput = {
  content: string;
  type: "text" | "image" | "poll" | "question";
  image_url?: string | null;
  community_id?: string | null;
  poll_options?: string[] | null;
  is_anonymous?: boolean;
};

export async function createPost(input: CreatePostInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not signed in" };

  const content = input.content.trim();
  if (content.length === 0) return { ok: false as const, error: "Say something first" };
  if (content.length > 2000) return { ok: false as const, error: "Keep it under 2000 chars" };

  const pollOptions =
    input.type === "poll"
      ? (input.poll_options ?? [])
          .map((s) => s.trim())
          .filter((s) => s.length > 0)
      : null;

  if (input.type === "poll" && (pollOptions?.length ?? 0) < 2) {
    return { ok: false as const, error: "A poll needs at least 2 options" };
  }

  const { data, error } = await supabase
    .from("posts")
    .insert({
      author_id: user.id,
      content,
      type: input.type,
      image_url: input.image_url ?? null,
      community_id: input.community_id ?? null,
      poll_options: pollOptions
        ? pollOptions.map((label, i) => ({ index: i, label }))
        : null,
      is_anonymous: !!input.is_anonymous,
    })
    .select("id")
    .single();

  if (error) return { ok: false as const, error: error.message };

  revalidatePath("/feed");
  return { ok: true as const, id: data.id };
}

export async function deletePost(postId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not signed in" };
  const { error } = await supabase
    .from("posts")
    .update({ is_deleted: true })
    .eq("id", postId)
    .eq("author_id", user.id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/feed");
  return { ok: true as const };
}

export async function toggleReaction(
  postId: string,
  type: "relatable" | "funny" | "fire" | "mood" | "heart",
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not signed in" };

  const { data: existing } = await supabase
    .from("reactions")
    .select("id")
    .eq("post_id", postId)
    .eq("profile_id", user.id)
    .eq("type", type)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from("reactions").delete().eq("id", existing.id);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const, active: false };
  }

  const { error } = await supabase
    .from("reactions")
    .insert({ post_id: postId, profile_id: user.id, type });
  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const, active: true };
}

export async function createComment({
  postId,
  content,
  parentId,
}: {
  postId: string;
  content: string;
  parentId?: string | null;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not signed in" };
  const text = content.trim();
  if (text.length === 0) return { ok: false as const, error: "Empty comment" };

  const { error } = await supabase.from("comments").insert({
    post_id: postId,
    author_id: user.id,
    content: text,
    parent_id: parentId ?? null,
  });
  if (error) return { ok: false as const, error: error.message };
  revalidatePath(`/feed/post/${postId}`);
  return { ok: true as const };
}

export async function votePoll(postId: string, optionIndex: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Not signed in" };

  const { error } = await supabase
    .from("poll_votes")
    .upsert({ post_id: postId, profile_id: user.id, option_index: optionIndex });
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/feed");
  revalidatePath(`/feed/post/${postId}`);
  return { ok: true as const };
}
