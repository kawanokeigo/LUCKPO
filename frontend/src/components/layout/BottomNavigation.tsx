const items = [
  { id: "home", label: "ホーム", icon: "homeIcon.svg" },
  { id: "search", label: "検索", icon: "searchIcon.svg" },
  { id: "gacha", label: "ガチャ", icon: "capsule.svg" },
  { id: "notifications", label: "通知", icon: "bell.svg" },
  { id: "settings", label: "設定", icon: "setting.svg" },
] as const;

export type NavigationItem = (typeof items)[number]["id"];

type BottomNavigationProps = {
  activeItem: NavigationItem;
  onSelect: (item: NavigationItem) => void;
};

export default function BottomNavigation({
  activeItem,
  onSelect,
}: BottomNavigationProps) {
  return (
    <nav className="bottom-navigation" aria-label="メインナビゲーション">
      {items.map(({ id, label, icon }) => (
        <button
          key={id}
          type="button"
          className="bottom-navigation__button"
          aria-label={label}
          aria-current={activeItem === id ? "page" : undefined}
          onClick={() => onSelect(id)}
        >
          <span
            className="bottom-navigation__icon"
            style={{ maskImage: `url("/images/${icon}")` }}
            aria-hidden="true"
          />
        </button>
      ))}
    </nav>
  );
}
