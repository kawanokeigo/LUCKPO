import { useState } from "react";
import AppHeader from "../components/layout/AppHeader";
import BottomNavigation from "../components/layout/BottomNavigation";
import type { NavigationItem } from "../components/layout/BottomNavigation";

export default function HomePage() {
  const [activeItem, setActiveItem] = useState<NavigationItem>("home");

  return (
    <div className="app-shell">
      <AppHeader />
      <main className="home-content" aria-label="ホーム" />
      <BottomNavigation activeItem={activeItem} onSelect={setActiveItem} />
    </div>
  );
}
