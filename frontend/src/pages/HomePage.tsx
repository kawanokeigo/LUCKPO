import { useState } from "react";
import AppHeader from "../components/layout/AppHeader";
import BottomNavigation from "../components/layout/BottomNavigation";
import CreatePostButton from "../components/navigation/CreatePostButton";
import type { NavigationItem } from "../components/layout/BottomNavigation";
import FeedTabs, { type FeedTab } from "../features/timeline/components/FeedTabs";
import TimelineFeed from "../features/timeline/components/TimelineFeed";
import type { TimelinePost } from "../features/timeline/types";

type HomePageProps = {
  activeItem: NavigationItem;
  onNavigationChange: (item: NavigationItem) => void;
  hasUnreadNotifications: boolean;
  showUnluckPosts: boolean;
  onCreatePost: () => void;
  onOpenProfile: (handle: string) => void;
  onOpenMyProfile: () => void;
  avatarUrl: string | null;
  allPosts: TimelinePost[];
  followingUserIds: string[];
  onLikeChange: (postId: string, liked: boolean) => Promise<void>;
};

export default function HomePage({
  activeItem,
  onNavigationChange,
  hasUnreadNotifications,
  showUnluckPosts,
  onCreatePost,
  onOpenProfile,
  onOpenMyProfile,
  avatarUrl,
  allPosts,
  followingUserIds,
  onLikeChange,
}: HomePageProps) {
  const [activeTab, setActiveTab] = useState<FeedTab>("recommended");
  const followingIds = new Set(followingUserIds);
  const sortedPosts = [...allPosts].sort((first, second) => {
    if (activeTab === "new") return second.timestamp.localeCompare(first.timestamp);

    if (followingIds.size > 0) {
      const firstIsFollowed = Boolean(first.authorId && followingIds.has(first.authorId));
      const secondIsFollowed = Boolean(second.authorId && followingIds.has(second.authorId));
      if (firstIsFollowed !== secondIsFollowed) return Number(secondIsFollowed) - Number(firstIsFollowed);
      if (firstIsFollowed && secondIsFollowed) return second.timestamp.localeCompare(first.timestamp);
    }

    return second.likes - first.likes || second.timestamp.localeCompare(first.timestamp);
  });
  const posts = showUnluckPosts ? sortedPosts : sortedPosts.filter((post) => post.kind !== "unluck");

  return (
    <div className="app-shell app-shell--home">
      <div className="timeline-top">
        <AppHeader showBottomLine={false} onMyProfileClick={onOpenMyProfile} avatarUrl={avatarUrl} />
        <FeedTabs activeTab={activeTab} onChange={setActiveTab} />
      </div>
      <main className="home-content" aria-label="ホーム">
        <TimelineFeed
          posts={posts}
          onLikeChange={onLikeChange}
          onOpenProfile={onOpenProfile}
        />
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
