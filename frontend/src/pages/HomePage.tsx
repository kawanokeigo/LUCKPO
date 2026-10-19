import { useState } from "react";
import AppHeader from "../components/layout/AppHeader";
import BottomNavigation from "../components/layout/BottomNavigation";
import CreatePostButton from "../components/navigation/CreatePostButton";
import type { NavigationItem } from "../components/layout/BottomNavigation";
import FeedTabs, { type FeedTab } from "../features/timeline/components/FeedTabs";
import TimelineFeed from "../features/timeline/components/TimelineFeed";
import { mockPosts } from "../features/timeline/data/mockPosts";

type HomePageProps = {
  activeItem: NavigationItem;
  onNavigationChange: (item: NavigationItem) => void;
};

export default function HomePage({ activeItem, onNavigationChange }: HomePageProps) {
  const [activeTab, setActiveTab] = useState<FeedTab>("recommended");
  const posts =
    activeTab === "new"
      ? [...mockPosts].sort((first, second) => second.timestamp.localeCompare(first.timestamp))
      : mockPosts;

  return (
    <div className="app-shell">
      <div className="timeline-top">
        <AppHeader showBottomLine={false} />
        <FeedTabs activeTab={activeTab} onChange={setActiveTab} />
      </div>
      <main className="home-content" aria-label="ホーム">
        <TimelineFeed posts={posts} />
      </main>
      <CreatePostButton />
      <BottomNavigation activeItem={activeItem} onSelect={onNavigationChange} />
    </div>
  );
}
