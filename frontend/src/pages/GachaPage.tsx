import AppHeader from "../components/layout/AppHeader";
import BottomNavigation, { type NavigationItem } from "../components/layout/BottomNavigation";

type GachaPageProps = {
  activeItem: NavigationItem;
  onNavigationChange: (item: NavigationItem) => void;
  hasUnreadNotifications: boolean;
  onOpenMyProfile: () => void;
};

export default function GachaPage({
  activeItem,
  onNavigationChange,
  hasUnreadNotifications,
  onOpenMyProfile,
}: GachaPageProps) {
  return (
    <div className="app-shell">
      <div className="gacha-top">
        <AppHeader showBottomLine={false} onMyProfileClick={onOpenMyProfile} />
        <h1 className="gacha-title">ガチャ</h1>
      </div>
      <main className="gacha-content" aria-label="ガチャ" />
      <BottomNavigation
        activeItem={activeItem}
        onSelect={onNavigationChange}
        hasUnreadNotifications={hasUnreadNotifications}
      />
    </div>
  );
}
