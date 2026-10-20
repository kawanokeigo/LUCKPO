import { useState } from "react";
import AppHeader from "../components/layout/AppHeader";
import BottomNavigation, { type NavigationItem } from "../components/layout/BottomNavigation";
import CreatePostButton from "../components/navigation/CreatePostButton";
import TimelineFeed from "../features/timeline/components/TimelineFeed";
import { mockPosts } from "../features/timeline/data/mockPosts";
import type { ProfileUser } from "../features/profile/types";

type UserProfilePageProps = {
  user: ProfileUser;
  activeItem: NavigationItem;
  onNavigationChange: (item: NavigationItem) => void;
  hasUnreadNotifications: boolean;
  showUnluckPosts: boolean;
  onCreatePost: () => void;
  onBack: () => void;
  onOpenMyProfile: () => void;
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
}: UserProfilePageProps) {
  const [isFollowing, setIsFollowing] = useState(user.following);
  const [followerCount, setFollowerCount] = useState(user.followerCount);

  const posts = mockPosts
    .filter((post) => showUnluckPosts || post.kind !== "unluck")
    .map((post) => ({ ...post, authorName: user.name, handle: user.handle }));

  function toggleFollow() {
    setIsFollowing((following) => !following);
    setFollowerCount((count) => count + (isFollowing ? -1 : 1));
  }

  return (
    <div className="app-shell">
      <div className="user-profile-top">
        <AppHeader showBottomLine onMyProfileClick={onOpenMyProfile} />
        <section className="user-profile-summary" aria-label={`${user.name}のプロフィール`}>
          <div className="user-profile-summary__top">
            <div className="user-profile-summary__avatar" aria-hidden="true" />
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
            onClick={toggleFollow}
          >
            {isFollowing ? "フォロー中" : "フォローする"}
          </button>
        </section>
        <div className="user-profile-posts-tab" aria-current="page">投稿</div>
      </div>

      <main className="user-profile-content" aria-label={`${user.name}の投稿`}>
        {posts.length ? (
          <TimelineFeed posts={posts} />
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
