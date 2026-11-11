import AppHeader from "../components/layout/AppHeader";
import BottomNavigation from "../components/layout/BottomNavigation";

type SignInPageProps = {
  onSignIn: () => void;
  disabled: boolean;
  error?: string;
};

export default function SignInPage({ onSignIn, disabled, error }: SignInPageProps) {
  return (
    <div className="app-shell">
      <div className="signin-top">
        <AppHeader showProfileIcon={false} showBottomLine={false} />
      </div>
      <main className="signin-content" aria-label="サインイン">
        <div className="signin-actions">
        <button className="signin-google" type="button" onClick={onSignIn} disabled={disabled}>
          <img className="signin-google__image" src="/images/googleImg.png" alt="Sign in with Google" />
        </button>
        {error && <p className="signin-error" role="alert">{error}</p>}
        </div>
      </main>
      <BottomNavigation activeItem="home" onSelect={() => {}} hasUnreadNotifications={false} />
    </div>
  );
}
