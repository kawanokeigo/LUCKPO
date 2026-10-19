import { useMemo, useState } from "react";
import AppHeader from "../components/layout/AppHeader";
import BottomNavigation, { type NavigationItem } from "../components/layout/BottomNavigation";
import CreatePostButton from "../components/navigation/CreatePostButton";
import TimelineFeed from "../features/timeline/components/TimelineFeed";
import { mockPosts } from "../features/timeline/data/mockPosts";

type SearchTab = "topics" | "latest" | "users";

const mockUsers = [
  { name: "ユーザー", handle: "@USER", bio: "プロフィール文がここに入ります", following: false },
  { name: "ユーザー", handle: "@USER2", bio: "ゲームとカードが好きです", following: true },
  { name: "ユーザー", handle: "@USER3", bio: "今日の運勢を記録しています", following: true },
  { name: "ユーザー", handle: "@USER4", bio: "レアを引きたい！", following: true },
  { name: "ユーザー", handle: "@USER5", bio: "幸運も不運も共有中", following: false },
  { name: "ユーザー", handle: "@USER6", bio: "よろしくお願いします", following: false },
  { name: "ユーザー", handle: "@USER7", bio: "毎日ガチャを引いてます", following: true },
];

const tabs: { id: SearchTab; label: string }[] = [
  { id: "topics", label: "話題" },
  { id: "latest", label: "最新" },
  { id: "users", label: "ユーザー" },
];

type SearchPageProps = {
  activeItem: NavigationItem;
  onNavigationChange: (item: NavigationItem) => void;
};

export default function SearchPage({ activeItem, onNavigationChange }: SearchPageProps) {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<SearchTab>("topics");
  const [followingUsers, setFollowingUsers] = useState(
    () => Object.fromEntries(mockUsers.map((user) => [user.handle, user.following])),
  );
  const normalizedQuery = query.trim().toLocaleLowerCase();

  const matchingPosts = useMemo(() => {
    const filtered = mockPosts.filter((post) =>
      `${post.body} ${post.authorName} ${post.handle} ${post.probability}`
        .toLocaleLowerCase()
        .includes(normalizedQuery),
    );

    if (activeTab === "latest") {
      return [...filtered].sort((first, second) => second.timestamp.localeCompare(first.timestamp));
    }

    return [...filtered].sort((first, second) => second.likes - first.likes);
  }, [activeTab, normalizedQuery]);

  const matchingUsers = useMemo(() => {
    return mockUsers.filter((user) =>
      `${user.name} ${user.handle} ${user.bio}`.toLocaleLowerCase().includes(normalizedQuery),
    );
  }, [normalizedQuery]);

  function toggleFollowing(handle: string) {
    setFollowingUsers((users) => ({ ...users, [handle]: !users[handle] }));
  }

  return (
    <div className="app-shell">
      <div className="search-top">
        <AppHeader showBottomLine={false} />
        <form className="search-form" role="search" onSubmit={(event) => event.preventDefault()}>
          <span className="search-form__icon" aria-hidden="true" />
          <input
            aria-label="投稿やユーザーを検索"
            type="search"
            placeholder="検索"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </form>
        <nav className="search-tabs" aria-label="検索結果の種類" role="tablist">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`search-tabs__tab${activeTab === tab.id ? " is-active" : ""}`}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <main className="search-content" aria-label="検索結果">
        {activeTab === "users" ? (
          <section className="search-user-list" aria-label="ユーザー">
            {matchingUsers.map((user) => (
              <article className="search-user" key={user.handle}>
                <div className="search-user__avatar" aria-hidden="true" />
                <div className="search-user__identity">
                  <div className="search-user__author-line">
                    <strong>{user.name}</strong>
                    <span>{user.handle}</span>
                  </div>
                  <p>{user.bio}</p>
                </div>
                <button
                  className={`search-user__follow${followingUsers[user.handle] ? " is-following" : ""}`}
                  type="button"
                  aria-pressed={followingUsers[user.handle]}
                  onClick={() => toggleFollowing(user.handle)}
                >
                  {followingUsers[user.handle] ? "フォロー中" : "フォローする"}
                </button>
              </article>
            ))}
            {matchingUsers.length === 0 && <p className="search-empty">ユーザーが見つかりません</p>}
          </section>
        ) : matchingPosts.length > 0 ? (
          <TimelineFeed posts={matchingPosts} />
        ) : (
          <p className="search-empty">投稿が見つかりません</p>
        )}
      </main>

      <CreatePostButton />
      <BottomNavigation activeItem={activeItem} onSelect={onNavigationChange} />
    </div>
  );
}
