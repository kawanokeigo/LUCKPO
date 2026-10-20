import { useMemo, useState } from "react";
import AppHeader from "../components/layout/AppHeader";
import BottomNavigation, { type NavigationItem } from "../components/layout/BottomNavigation";
import CreatePostButton from "../components/navigation/CreatePostButton";
import TimelineFeed from "../features/timeline/components/TimelineFeed";
import { mockPosts } from "../features/timeline/data/mockPosts";
import { mockUsers } from "../features/profile/data/mockUsers";
import type { ProfileUser } from "../features/profile/types";

type SearchTab = "topics" | "latest" | "users";

const tabs: { id: SearchTab; label: string }[] = [
  { id: "topics", label: "話題" },
  { id: "latest", label: "最新" },
  { id: "users", label: "ユーザー" },
];

type SearchPageProps = {
  activeItem: NavigationItem;
  onNavigationChange: (item: NavigationItem) => void;
  hasUnreadNotifications: boolean;
  showUnluckPosts: boolean;
  onCreatePost: () => void;
  onOpenProfile: (user: ProfileUser) => void;
  onOpenMyProfile: () => void;
};

export default function SearchPage({
  activeItem,
  onNavigationChange,
  hasUnreadNotifications,
  showUnluckPosts,
  onCreatePost,
  onOpenProfile,
  onOpenMyProfile,
}: SearchPageProps) {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<SearchTab>("topics");
  const [followingUsers, setFollowingUsers] = useState(
    () => Object.fromEntries(mockUsers.map((user) => [user.handle, user.following])),
  );
  const normalizedQuery = query.trim().toLocaleLowerCase();

  const matchingPosts = useMemo(() => {
    const filtered = mockPosts.filter((post) =>
      (showUnluckPosts || post.kind !== "unluck") &&
      `${post.body} ${post.authorName} ${post.handle} ${post.probability}`
        .toLocaleLowerCase()
        .includes(normalizedQuery),
    );

    if (activeTab === "latest") {
      return [...filtered].sort((first, second) => second.timestamp.localeCompare(first.timestamp));
    }

    return [...filtered].sort((first, second) => second.likes - first.likes);
  }, [activeTab, normalizedQuery, showUnluckPosts]);

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
        <AppHeader showBottomLine={false} onMyProfileClick={onOpenMyProfile} />
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
                <button
                  className="search-user__avatar search-user__avatar-button"
                  type="button"
                  aria-label={`${user.name}のプロフィールを開く`}
                  onClick={() => onOpenProfile(user)}
                />
                <div className="search-user__identity">
                  <button
                    className="search-user__profile-open"
                    type="button"
                    onClick={() => onOpenProfile(user)}
                    aria-label={`${user.name} ${user.handle}のプロフィールを開く`}
                  >
                    <strong>{user.name}</strong>
                    <span>{user.handle}</span>
                  </button>
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
          <TimelineFeed
            posts={matchingPosts}
            onOpenProfile={(handle) => {
              const user = mockUsers.find((candidate) => candidate.handle === handle);
              if (user) onOpenProfile(user);
            }}
          />
        ) : (
          <p className="search-empty">投稿が見つかりません</p>
        )}
      </main>

      <CreatePostButton onClick={onCreatePost} />
      <BottomNavigation
        activeItem={activeItem}
        onSelect={onNavigationChange}
        hasUnreadNotifications={hasUnreadNotifications}
      />
    </div>
  );
}
