import { useState } from "react";
import AppHeader from "../components/layout/AppHeader";
import BottomNavigation, { type NavigationItem } from "../components/layout/BottomNavigation";
import FortuneResult from "../features/gacha/components/FortuneResult";
import GachaMachine from "../features/gacha/components/GachaMachine";
import { drawFortune } from "../features/gacha/data/fortunes";
import type { Fortune } from "../features/gacha/types";
import type { PostCreatePrefill } from "../features/post-create/types";

type GachaPageProps = {
  activeItem: NavigationItem;
  onNavigationChange: (item: NavigationItem) => void;
  hasUnreadNotifications: boolean;
  onOpenMyProfile: () => void;
  onCreatePost: (prefill: PostCreatePrefill) => void;
};

export default function GachaPage({
  activeItem,
  onNavigationChange,
  hasUnreadNotifications,
  onOpenMyProfile,
  onCreatePost,
}: GachaPageProps) {
  const [fortune, setFortune] = useState<Fortune | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  function handleDraw() {
    if (isDrawing) return;
    setIsDrawing(true);
    setFortune(null);
    window.setTimeout(() => {
      setFortune(drawFortune());
      setIsDrawing(false);
    }, 520);
  }

  function handleCreatePost() {
    if (!fortune) return;
    onCreatePost({
      kind: fortune.kind,
      probability: fortune.probability,
      body: `おみくじガチャで「${fortune.name}」が出た！\n${fortune.message}`,
    });
  }

  return (
    <div className="app-shell">
      <div className="gacha-top">
        <AppHeader showBottomLine={false} onMyProfileClick={onOpenMyProfile} />
        <h1 className="gacha-title">ガチャ</h1>
      </div>
      <main className={`gacha-content${fortune ? " has-result" : ""}`} aria-label="運勢ガチャ">
        <GachaMachine isDrawing={isDrawing} />
        {fortune ? (
          <FortuneResult
            fortune={fortune}
            onCreatePost={handleCreatePost}
          />
        ) : null}
        <div className="gacha-controls">
          <button
            className="gacha-machine__draw"
            type="button"
            onClick={handleDraw}
            disabled={isDrawing}
            aria-label={fortune ? "もう一度ガチャを回す" : "ガチャを回す"}
          >
            {fortune ? "もう一度ガチャを回す" : "ガチャを回す"}
          </button>
        </div>
      </main>
      <BottomNavigation
        activeItem={activeItem}
        onSelect={onNavigationChange}
        hasUnreadNotifications={hasUnreadNotifications}
      />
    </div>
  );
}
