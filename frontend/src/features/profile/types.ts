export type ProfileUser = {
  id?: string;
  name: string;
  handle: string;
  bio: string;
  avatarUrl?: string | null;
  following: boolean;
  followingCount: number;
  followerCount: number;
};
