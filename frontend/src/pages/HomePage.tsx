import AppHeader from "../components/layout/AppHeader";

export default function HomePage() {
  return (
    <div className="app-shell">
      <AppHeader />
      <main className="home-content" aria-label="ホーム" />
    </div>
  );
}
