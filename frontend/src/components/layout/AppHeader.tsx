import BrandLogo from "../brand/BrandLogo";
import ProfileAvatar from "../profile/ProfileAvatar";

type AppHeaderProps = {
  showBottomLine?: boolean;
};

export default function AppHeader({ showBottomLine = true }: AppHeaderProps) {
  return (
    <header className={`app-header${showBottomLine ? " app-header--with-line" : ""}`}>
      <ProfileAvatar />
      <BrandLogo />
    </header>
  );
}
