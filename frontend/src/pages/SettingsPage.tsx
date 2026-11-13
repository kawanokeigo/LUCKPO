import AppHeader from "../components/layout/AppHeader";
import BottomNavigation, { type NavigationItem } from "../components/layout/BottomNavigation";
import CreatePostButton from "../components/navigation/CreatePostButton";

type SettingsPageProps = {
  activeItem: NavigationItem;
  onNavigationChange: (item: NavigationItem) => void;
  showUnluckPosts: boolean;
  onShowUnluckPostsChange: (value: boolean) => void;
  showNotificationBadge: boolean;
  onShowNotificationBadgeChange: (value: boolean) => void;
  hasUnreadNotifications: boolean;
  onCreatePost: () => void;
  onOpenMyProfile: () => void;
  onLogout: () => void;
  avatarUrl: string | null;
};

type SettingSwitchProps = {
  label: string;
  enabled: boolean;
  onChange: (value: boolean) => void;
  variant: "purple" | "gray";
};

function SettingSwitch({ label, enabled, onChange, variant }: SettingSwitchProps) {
  return (
    <button
      className={`settings-switch settings-switch--${variant}${enabled ? " is-on" : " is-off"}`}
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={label}
      onClick={() => onChange(!enabled)}
    >
      <span className="settings-switch__label">{enabled ? "表示する" : "表示しない"}</span>
      <span className="settings-switch__thumb" aria-hidden="true" />
    </button>
  );
}

export default function SettingsPage({
  activeItem,
  onNavigationChange,
  showUnluckPosts,
  onShowUnluckPostsChange,
  showNotificationBadge,
  onShowNotificationBadgeChange,
  hasUnreadNotifications,
  onCreatePost,
  onOpenMyProfile,
  onLogout,
  avatarUrl,
}: SettingsPageProps) {
  return (
    <div className="app-shell">
      <div className="settings-top">
        <AppHeader showBottomLine={false} onMyProfileClick={onOpenMyProfile} avatarUrl={avatarUrl} />
        <h1 className="settings-title">設定</h1>
      </div>

      <main className="settings-content" aria-label="設定">
        <section className="settings-section settings-section--account">
          <h2>アカウント設定</h2>
          <div className="settings-section__actions">
            <button className="settings-danger-button" type="button" onClick={onLogout}>ログアウト</button>
            <button className="settings-danger-button" type="button">アカウント削除</button>
          </div>
        </section>

        <section className="settings-section">
          <h2>投稿設定</h2>
          <div className="settings-option">
            <p>不幸な投稿の表示</p>
            <SettingSwitch
              label="不幸な投稿の表示"
              enabled={showUnluckPosts}
              onChange={onShowUnluckPostsChange}
              variant="purple"
            />
          </div>
        </section>

        <section className="settings-section">
          <h2>通知設定</h2>
          <div className="settings-option">
            <p>通知のバッジ表示</p>
            <SettingSwitch
              label="通知のバッジ表示"
              enabled={showNotificationBadge}
              onChange={onShowNotificationBadgeChange}
              variant="gray"
            />
          </div>
        </section>
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
