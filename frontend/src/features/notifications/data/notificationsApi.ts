import type { NotificationItem } from "../types";
import { supabase } from "../../../lib/supabase";

function requireSupabase() {
  if (!supabase) throw new Error("Supabase is not configured.");
  return supabase;
}

export async function fetchNotifications(userId: string): Promise<{ items: NotificationItem[]; hasUnread: boolean }> {
  const client = requireSupabase();
  const { data: rows, error } = await client
    .from("notifications")
    .select("id,actor_id,post_id,kind,created_at,read_at")
    .eq("recipient_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  if (!rows?.length) return { items: [], hasUnread: false };

  const actorIds = [...new Set(rows.map((row) => row.actor_id))];
  const postIds = [...new Set(rows.flatMap((row) => row.post_id ? [row.post_id] : []))];
  const [{ data: profiles, error: profileError }, { data: posts, error: postsError }] = await Promise.all([
    client.from("profiles").select("id,handle,display_name").in("id", actorIds),
    postIds.length
      ? client.from("posts").select("id,body").in("id", postIds)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (profileError) throw profileError;
  if (postsError) throw postsError;

  const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
  const postById = new Map((posts ?? []).map((post) => [post.id, post]));
  const items = rows.map((row) => {
    const actor = profileById.get(row.actor_id);
    const post = row.post_id ? postById.get(row.post_id) : undefined;
    const actorName = actor?.display_name ?? "ユーザー";
    const message = row.kind === "follow"
      ? `${actorName}さんにフォローされました。`
      : `${actorName}さんがあなたの投稿にいいねしました。`;
    return {
      id: row.id,
      message,
      postPreview: post?.body ?? (row.kind === "follow" ? `@${actor?.handle ?? "user"}` : ""),
      timestamp: row.created_at,
      dateLabel: new Intl.DateTimeFormat("ja-JP", { dateStyle: "short", timeStyle: "short" }).format(new Date(row.created_at)),
      isRead: Boolean(row.read_at),
    };
  });

  return { items, hasUnread: rows.some((row) => !row.read_at) };
}

export async function markNotificationsRead(userId: string) {
  const { error } = await requireSupabase()
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("recipient_id", userId)
    .is("read_at", null);
  if (error) throw error;
}
