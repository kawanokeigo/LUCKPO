import type { TimelinePost, PostKind } from "../types";
import { supabase } from "../../../lib/supabase";
import type { PostDraft } from "../../post-create/types";

type PostInsert = PostDraft;

type PostRow = {
  id: string;
  user_id: string;
  kind: PostKind;
  probability: string;
  body: string;
  image_path: string | null;
  created_at: string;
};

function requireSupabase() {
  if (!supabase) throw new Error("Supabase is not configured.");
  return supabase;
}

function toTimelinePost(row: PostRow, profile?: { handle: string; display_name: string; avatar_url: string | null }, likes: number[] = [], liked = false): TimelinePost {
  const date = new Date(row.created_at);
  const imageUrl = row.image_path
    ? requireSupabase().storage.from("post-images").getPublicUrl(row.image_path).data.publicUrl
    : undefined;
  return {
    id: row.id,
    kind: row.kind,
    authorName: profile?.display_name ?? "ユーザー",
    handle: `@${profile?.handle ?? "user"}`,
    probability: row.probability,
    body: row.body,
    timestamp: row.created_at,
    dateLabel: new Intl.DateTimeFormat("ja-JP", { dateStyle: "short", timeStyle: "short" }).format(date),
    likes: likes.length,
    liked,
    ...(imageUrl ? { image: { src: imageUrl, alt: "投稿画像" } } : {}),
  };
}

export async function fetchPosts(currentUserId?: string): Promise<TimelinePost[]> {
  const client = requireSupabase();
  const { data: rows, error } = await client
    .from("posts")
    .select("id,user_id,kind,probability,body,image_path,created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  if (!rows?.length) return [];

  const ids = rows.map((row) => row.id);
  const userIds = [...new Set(rows.map((row) => row.user_id))];
  const [{ data: profiles, error: profileError }, { data: likeRows, error: likesError }] = await Promise.all([
    client.from("profiles").select("id,handle,display_name,avatar_url").in("id", userIds),
    client.from("post_likes").select("post_id,user_id").in("post_id", ids),
  ]);
  if (profileError) throw profileError;
  if (likesError) throw likesError;

  const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
  const likesByPost = new Map<string, number[]>();
  const likedPostIds = new Set<string>();
  for (const like of likeRows ?? []) {
    likesByPost.set(like.post_id, [...(likesByPost.get(like.post_id) ?? []), 1]);
    if (currentUserId && like.user_id === currentUserId) likedPostIds.add(like.post_id);
  }

  return rows.map((row) => toTimelinePost(
    row as PostRow,
    profileById.get(row.user_id),
    likesByPost.get(row.id),
    likedPostIds.has(row.id),
  ));
}

export async function createPost(input: PostInsert): Promise<TimelinePost> {
  const client = requireSupabase();
  const { data: userData, error: userError } = await client.auth.getUser();
  if (userError) throw userError;
  const user = userData.user;
  if (!user) throw new Error("Sign in is required to post.");

  let imagePath: string | null = null;
  if (input.image) {
    const extension = input.image.name.split(".").pop()?.toLowerCase() || "jpg";
    imagePath = `${user.id}/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await client.storage.from("post-images").upload(imagePath, input.image, {
      contentType: input.image.type,
      upsert: false,
    });
    if (uploadError) throw uploadError;
  }

  const { data: row, error } = await client.from("posts").insert({
    user_id: user.id,
    kind: input.kind,
    probability: input.probability,
    body: input.body.trim(),
    image_path: imagePath,
  }).select("id,user_id,kind,probability,body,image_path,created_at").single();

  if (error) {
    if (imagePath) await client.storage.from("post-images").remove([imagePath]);
    throw error;
  }

  const { data: profile } = await client.from("profiles").select("handle,display_name,avatar_url").eq("id", user.id).single();
  return toTimelinePost(row as PostRow, profile ?? undefined, [], false);
}

export async function setPostLike(postId: string, liked: boolean) {
  const client = requireSupabase();
  const { data: userData, error: userError } = await client.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) throw new Error("Sign in is required to like posts.");

  const result = liked
    ? await client.from("post_likes").insert({ post_id: postId, user_id: userData.user.id })
    : await client.from("post_likes").delete().eq("post_id", postId).eq("user_id", userData.user.id);
  if (result.error && !(liked && result.error.code === "23505")) throw result.error;
}
