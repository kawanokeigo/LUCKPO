import { useState } from "react";
import type { NavigationItem } from "./components/layout/BottomNavigation";
import HomePage from "./pages/HomePage";
import SearchPage from "./pages/SearchPage";

export default function App() {
  const [activeItem, setActiveItem] = useState<NavigationItem>("home");

  return activeItem === "search" ? (
    <SearchPage activeItem={activeItem} onNavigationChange={setActiveItem} />
  ) : (
    <HomePage activeItem={activeItem} onNavigationChange={setActiveItem} />
  );
}
