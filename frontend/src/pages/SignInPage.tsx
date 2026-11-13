import AppHeader from "../components/layout/AppHeader";
import BottomNavigation from "../components/layout/BottomNavigation";

type SignInPageProps = {
  onSignIn: () => void;
  onGuestSignIn: () => void;
  disabled: boolean;
  guestLoginEnabled: boolean;
  guestDisabled: boolean;
  error?: string;
};

export default function SignInPage({ onSignIn, onGuestSignIn, disabled, guestLoginEnabled, guestDisabled, error }: SignInPageProps) {
  return (
    <div className="app-shell">
      <div className="signin-top">
        <AppHeader showProfileIcon={false} showBottomLine={false} />
      </div>
      <main className="signin-content" aria-label="サインイン">
        <div className="signin-actions">
          <button className="signin-google" type="button" onClick={onSignIn} disabled={disabled}>
            <img className="signin-google__image" src="/images/googleImg.png" alt="Googleでログイン" />
          </button>
          {guestLoginEnabled && (
            <div className="signin-guest-group">
              <button className="signin-guest" type="button" onClick={onGuestSignIn} disabled={guestDisabled}>
                ゲストとしてログイン
              </button>
              <p className="signin-guest-note">アカウント登録なしでお試しいただけます</p>
            </div>
          )}
          {error && <p className="signin-error" role="alert">{error}</p>}
        </div>
      </main>
      <BottomNavigation activeItem="home" onSelect={() => {}} hasUnreadNotifications={false} />
    </div>
  );
}
