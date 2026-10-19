export type FeedTab = "recommended" | "new";

type FeedTabsProps = {
  activeTab: FeedTab;
  onChange: (tab: FeedTab) => void;
};

const tabs: { id: FeedTab; label: string }[] = [
  { id: "recommended", label: "おすすめ" },
  { id: "new", label: "新着" },
];

export default function FeedTabs({ activeTab, onChange }: FeedTabsProps) {
  return (
    <nav className="feed-tabs" aria-label="投稿の並び順" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`feed-tabs__tab${activeTab === tab.id ? " is-active" : ""}`}
          type="button"
          role="tab"
          aria-selected={activeTab === tab.id}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
