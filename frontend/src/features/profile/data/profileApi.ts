import { supabase } from "../../../lib/supabase";
import type { ProfileUser } from "../types";

export type AccountProfile = {
  id: string;
  handle: string;
  display_name: string;
  bio: string;
  avatar_url: string | null;
  is_onboarded: boolean;
};

function requireSupabase() {
  if (!supabase) throw new Error("Supabase is not configured.");
  return supabase;
}

async function uploadProfileAvatar(userId: string, file: File) {
  const client = requireSupabase();
  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${userId}/avatars/${crypto.randomUUID()}.${extension}`;
  const { error } = await client.storage.from("post-images").upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw error;
  return client.storage.from("post-images").getPublicUrl(path).data.publicUrl;
}

export async function fetchMyProfile(userId: string): Promise<AccountProfile> {
  const { data, error } = await requireSupabase()
    .from("profiles")
    .select("id,handle,display_name,bio,avatar_url,is_onboarded")
    .eq("id", userId)
    .single();
  if (error) throw error;
  return data as AccountProfile;
}

export async function fetchProfileByHandle(handle: string, currentUserId: string): Promise<ProfileUser | null> {
  const client = requireSupabase();
  const normalizedHandle = handle.replace(/^@/, "");
  const { data: profile, error } = await client
    .from("profiles")
    .select("id,handle,display_name,bio,avatar_url")
    .ilike("handle", normalizedHandle)
    .maybeSingle();
  if (error) throw error;
  if (!profile) return null;

  const [{ count: followingCount, error: followingError }, { count: followerCount, error: followerError }, { data: relation, error: relationError }] = await Promise.all([
    client.from("follows").select("follower_id", { count: "exact", head: true }).eq("follower_id", profile.id),
    client.from("follows").select("follower_id", { count: "exact", head: true }).eq("following_id", profile.id),
    client.from("follows").select("follower_id").eq("follower_id", currentUserId).eq("following_id", profile.id).maybeSingle(),
  ]);
  if (followingError) throw followingError;
  if (followerError) throw followerError;
  if (relationError) throw relationError;
  return {
    id: profile.id,
    name: profile.display_name,
    handle: `@${profile.handle}`,
    bio: profile.bio,
    avatarUrl: profile.avatar_url,
    following: Boolean(relation),
    followingCount: followingCount ?? 0,
    followerCount: followerCount ?? 0,
  };
}

export async function fetchFollowingIds(userId: string): Promise<string[]> {
  const { data, error } = await requireSupabase()
    .from("follows")
    .select("following_id")
    .eq("follower_id", userId);
  if (error) throw error;
  return (data ?? []).map((row) => row.following_id);
}

export async function searchProfiles(query: string, currentUserId: string): Promise<ProfileUser[]> {
  const client = requireSupabase();
  const term = query.trim();
  const fields = "id,handle,display_name,bio,avatar_url";
  let profiles;
  if (term) {
    const results = await Promise.all([
      client.from("profiles").select(fields).ilike("handle", `%${term}%`).limit(50),
      client.from("profiles").select(fields).ilike("display_name", `%${term}%`).limit(50),
      client.from("profiles").select(fields).ilike("bio", `%${term}%`).limit(50),
    ]);
    const failed = results.find((result) => result.error);
    if (failed?.error) throw failed.error;
    profiles = [...new Map(results.flatMap((result) => result.data ?? []).map((profile) => [profile.id, profile])).values()]
      .sort((first, second) => first.display_name.localeCompare(second.display_name))
      .slice(0, 50);
  } else {
    const { data, error } = await client.from("profiles").select(fields).order("display_name").limit(50);
    if (error) throw error;
    profiles = data ?? [];
  }
  if (!profiles.length) return [];

  const ids = profiles.map((profile) => profile.id);
  const { data: follows, error: followsError } = await client
    .from("follows")
    .select("follower_id,following_id")
    .or(`follower_id.in.(${ids.join(",")}),following_id.in.(${ids.join(",")})`);
  if (followsError) throw followsError;
  const rows = follows ?? [];
  return profiles.map((profile) => ({
    id: profile.id,
    name: profile.display_name,
    handle: `@${profile.handle}`,
    bio: profile.bio,
    avatarUrl: profile.avatar_url,
    following: rows.some((row) => row.follower_id === currentUserId && row.following_id === profile.id),
    followingCount: rows.filter((row) => row.follower_id === profile.id).length,
    followerCount: rows.filter((row) => row.following_id === profile.id).length,
  }));
}

export async function toggleFollow(userId: string, targetUserId: string, following: boolean) {
  if (userId === targetUserId) return;
  const client = requireSupabase();
  const result = following
    ? await client.from("follows").delete().eq("follower_id", userId).eq("following_id", targetUserId)
    : await client.from("follows").insert({ follower_id: userId, following_id: targetUserId });
  if (result.error && !( !following && result.error.code === "23505")) throw result.error;
}

export async function updateMyProfile(input: { displayName: string; handle: string; bio: string; avatar?: File | null }) {
  const client = requireSupabase();
  const { data: { user }, error: userError } = await client.auth.getUser();
  if (userError) throw userError;
  if (!user) throw new Error("Sign in is required.");

  let avatarUrl: string | undefined;
  if (input.avatar) {
    avatarUrl = await uploadProfileAvatar(user.id, input.avatar);
  }

  const { data, error } = await client.from("profiles").update({
    display_name: input.displayName.trim(),
    handle: input.handle.replace(/^@/, "").trim(),
    bio: input.bio.trim(),
    ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
  }).eq("id", user.id).select("id,handle,display_name,bio,avatar_url,is_onboarded").single();
  if (error) throw error;
  return data as AccountProfile;
}

export async function completeProfileSetup(input: { displayName: string; handle: string; avatar?: File | null }) {
  const client = requireSupabase();
  const { data: { user }, error: userError } = await client.auth.getUser();
  if (userError) throw userError;
  if (!user) throw new Error("Sign in is required.");

  const handle = input.handle.replace(/^@/, "").trim();
  const avatarUrl = input.avatar ? await uploadProfileAvatar(user.id, input.avatar) : undefined;
  const { data, error } = await client.from("profiles").update({
    display_name: input.displayName.trim(),
    handle,
    bio: "",
    is_onboarded: true,
    avatar_url: avatarUrl ?? null,
  }).eq("id", user.id).select("id,handle,display_name,bio,avatar_url,is_onboarded").single();
  if (error) throw error;
  return data as AccountProfile;
}
