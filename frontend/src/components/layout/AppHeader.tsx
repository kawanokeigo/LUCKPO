import BrandLogo from "../brand/BrandLogo";
import ProfileAvatar from "../profile/ProfileAvatar";

type AppHeaderProps = {
  showBottomLine?: boolean;
  showProfileIcon?: boolean;
  onMyProfileClick?: () => void;
  avatarUrl?: string | null;
};

export default function AppHeader({
  showBottomLine = true,
  showProfileIcon = true,
  onMyProfileClick,
  avatarUrl,
}: AppHeaderProps) {
  return (
    <header className={`app-header${showBottomLine ? " app-header--with-line" : ""}`}>
      {showProfileIcon && <ProfileAvatar onClick={onMyProfileClick} avatarUrl={avatarUrl} />}
      <BrandLogo />
    </header>
  );
}
