import { useState } from "react";
import AppHeader from "../components/layout/AppHeader";
import BottomNavigation from "../components/layout/BottomNavigation";
import CreatePostButton from "../components/navigation/CreatePostButton";
import type { NavigationItem } from "../components/layout/BottomNavigation";
import FeedTabs, { type FeedTab } from "../features/timeline/components/FeedTabs";
import TimelineFeed from "../features/timeline/components/TimelineFeed";
import { mockPosts } from "../features/timeline/data/mockPosts";
import { mockUsers } from "../features/profile/data/mockUsers";
import type { ProfileUser } from "../features/profile/types";

type HomePageProps = {
  activeItem: NavigationItem;
  onNavigationChange: (item: NavigationItem) => void;
  hasUnreadNotifications: boolean;
  showUnluckPosts: boolean;
  onCreatePost: () => void;
  onOpenProfile: (user: ProfileUser) => void;
  onOpenMyProfile: () => void;
};

export default function HomePage({
  activeItem,
  onNavigationChange,
  hasUnreadNotifications,
  showUnluckPosts,
  onCreatePost,
  onOpenProfile,
  onOpenMyProfile,
}: HomePageProps) {
  const [activeTab, setActiveTab] = useState<FeedTab>("recommended");
  const sortedPosts =
    activeTab === "new"
      ? [...mockPosts].sort((first, second) => second.timestamp.localeCompare(first.timestamp))
      : mockPosts;
  const posts = showUnluckPosts ? sortedPosts : sortedPosts.filter((post) => post.kind !== "unluck");

  return (
    <div className="app-shell">
      <div className="timeline-top">
        <AppHeader showBottomLine={false} onMyProfileClick={onOpenMyProfile} />
        <FeedTabs activeTab={activeTab} onChange={setActiveTab} />
      </div>
      <main className="home-content" aria-label="ホーム">
        <TimelineFeed
          posts={posts}
          onOpenProfile={(handle) => {
            const user = mockUsers.find((candidate) => candidate.handle === handle);
            if (user) onOpenProfile(user);
          }}
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
