import BrandLogo from "../brand/BrandLogo";
import ProfileAvatar from "../profile/ProfileAvatar";

type AppHeaderProps = {
  showBottomLine?: boolean;
  showProfileIcon?: boolean;
};

export default function AppHeader({
  showBottomLine = true,
  showProfileIcon = true,
}: AppHeaderProps) {
  return (
    <header className={`app-header${showBottomLine ? " app-header--with-line" : ""}`}>
      {showProfileIcon && <ProfileAvatar />}
      <BrandLogo />
    </header>
  );
}
