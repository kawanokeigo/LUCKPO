import AppHeader from "../components/layout/AppHeader";
import BottomNavigation, { type NavigationItem } from "../components/layout/BottomNavigation";
import CreatePostButton from "../components/navigation/CreatePostButton";
import NotificationList from "../features/notifications/components/NotificationList";
import type { NotificationItem } from "../features/notifications/types";

type NotificationsPageProps = {
  activeItem: NavigationItem;
  onNavigationChange: (item: NavigationItem) => void;
  hasUnreadNotifications: boolean;
  onCreatePost: () => void;
  onOpenMyProfile: () => void;
  notifications: NotificationItem[];
  avatarUrl: string | null;
};

export default function NotificationsPage({
  activeItem,
  onNavigationChange,
  hasUnreadNotifications,
  onCreatePost,
  onOpenMyProfile,
  notifications,
  avatarUrl,
}: NotificationsPageProps) {
  return (
    <div className="app-shell">
      <div className="notifications-top">
        <AppHeader showBottomLine={false} onMyProfileClick={onOpenMyProfile} avatarUrl={avatarUrl} />
        <h1 className="notifications-title">通知</h1>
      </div>
      <main className="notifications-content" aria-label="通知">
        <NotificationList notifications={notifications} />
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
