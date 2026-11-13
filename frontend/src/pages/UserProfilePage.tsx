import { useState } from "react";
import AppHeader from "../components/layout/AppHeader";
import BottomNavigation, { type NavigationItem } from "../components/layout/BottomNavigation";
import CreatePostButton from "../components/navigation/CreatePostButton";
import TimelineFeed from "../features/timeline/components/TimelineFeed";
import type { ProfileUser } from "../features/profile/types";
import type { TimelinePost } from "../features/timeline/types";

type UserProfilePageProps = {
  user: ProfileUser;
  activeItem: NavigationItem;
  onNavigationChange: (item: NavigationItem) => void;
  hasUnreadNotifications: boolean;
  showUnluckPosts: boolean;
  onCreatePost: () => void;
  onBack: () => void;
  onOpenMyProfile: () => void;
  posts: TimelinePost[];
  onLikeChange: (postId: string, liked: boolean) => Promise<void>;
  onToggleFollow: (userId: string, isFollowing: boolean) => Promise<void>;
  currentUserId: string;
  currentAvatarUrl: string | null;
};

export default function UserProfilePage({
  user,
  activeItem,
  onNavigationChange,
  hasUnreadNotifications,
  showUnluckPosts,
  onCreatePost,
  onBack,
  onOpenMyProfile,
  posts,
  onLikeChange,
  onToggleFollow,
  currentUserId,
  currentAvatarUrl,
}: UserProfilePageProps) {
  const [isFollowing, setIsFollowing] = useState(user.following);
  const [followerCount, setFollowerCount] = useState(user.followerCount);
  const [followError, setFollowError] = useState("");
  const visiblePosts = posts.filter((post) => showUnluckPosts || post.kind !== "unluck");

  async function toggleFollow() {
    if (!user.id || user.id === currentUserId) return;
    try {
      await onToggleFollow(user.id, isFollowing);
      setIsFollowing((following) => !following);
      setFollowerCount((count) => count + (isFollowing ? -1 : 1));
      setFollowError("");
    } catch {
      setFollowError("フォロー状態を更新できませんでした。");
    }
  }

  return (
    <div className="app-shell profile-page-shell">
      <div className="user-profile-top">
        <AppHeader showBottomLine onMyProfileClick={onOpenMyProfile} avatarUrl={currentAvatarUrl} />
        <section className="user-profile-summary" aria-label={`${user.name}のプロフィール`}>
          <div className="user-profile-summary__top">
            <div className={`user-profile-summary__avatar${user.avatarUrl ? " has-avatar" : ""}`} style={user.avatarUrl ? { backgroundImage: `url("${user.avatarUrl}")` } : undefined} aria-hidden="true" />
            <div className="user-profile-summary__identity">
              <h1>{user.name}</h1>
              <span>{user.handle}</span>
            </div>
            <button
              className="user-profile-back"
              type="button"
              aria-label="前の画面に戻る"
              onClick={onBack}
            >
              <img className="user-profile-back__icon" src="/images/return.svg" alt="" />
            </button>
          </div>
          <p className="user-profile-summary__bio">{user.bio}</p>
          <p className="user-profile-summary__counts">
            <span><strong>{user.followingCount}</strong> フォロー中</span>
            <span><strong>{followerCount}</strong> フォロワー</span>
          </p>
          <button
            className={`user-profile-summary__follow${isFollowing ? " is-following" : ""}`}
            type="button"
            aria-pressed={isFollowing}
            disabled={!user.id || user.id === currentUserId}
            onClick={toggleFollow}
          >
            {isFollowing ? "フォロー中" : "フォローする"}
          </button>
          {followError && <p role="alert">{followError}</p>}
        </section>
        <div className="user-profile-posts-tab" aria-current="page">投稿</div>
      </div>

      <main className="user-profile-content" aria-label={`${user.name}の投稿`}>
        {visiblePosts.length ? (
          <TimelineFeed posts={visiblePosts} onLikeChange={onLikeChange} />
        ) : (
          <p className="user-profile-empty">ユーザーの投稿がこれ以上ありません。</p>
        )}
      </main>

      <CreatePostButton onClick={onCreatePost} />
      <BottomNavigation
        activeItem={activeItem}
        onSelect={onNavigationChange}
        hasUnreadNotifications={hasUnreadNotifications}
      />
    </div>
  );
}
