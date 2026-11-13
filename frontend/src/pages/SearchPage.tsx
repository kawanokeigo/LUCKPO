import { useEffect, useMemo, useState } from "react";
import AppHeader from "../components/layout/AppHeader";
import BottomNavigation, { type NavigationItem } from "../components/layout/BottomNavigation";
import CreatePostButton from "../components/navigation/CreatePostButton";
import TimelineFeed from "../features/timeline/components/TimelineFeed";
import type { TimelinePost } from "../features/timeline/types";
import { searchProfiles, toggleFollow } from "../features/profile/data/profileApi";
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
  onOpenProfile: (handle: string) => void;
  onOpenMyProfile: () => void;
  posts: TimelinePost[];
  onLikeChange: (postId: string, liked: boolean) => Promise<void>;
  currentUserId: string;
  avatarUrl: string | null;
};

export default function SearchPage({
  activeItem,
  onNavigationChange,
  hasUnreadNotifications,
  showUnluckPosts,
  onCreatePost,
  onOpenProfile,
  onOpenMyProfile,
  posts,
  onLikeChange,
  currentUserId,
  avatarUrl,
}: SearchPageProps) {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<SearchTab>("topics");
  const [users, setUsers] = useState<ProfileUser[]>([]);
  const [usersError, setUsersError] = useState("");
  const normalizedQuery = query.trim().toLocaleLowerCase();

  useEffect(() => {
    let cancelled = false;
    void searchProfiles(query, currentUserId).then((result) => {
      if (!cancelled) {
        setUsers(result);
        setUsersError("");
      }
    }).catch(() => {
      if (!cancelled) setUsersError("ユーザーを読み込めませんでした。時間をおいて再度お試しください。");
    });
    return () => { cancelled = true; };
  }, [currentUserId, query]);

  const matchingPosts = useMemo(() => {
    const filtered = posts.filter((post) =>
      (showUnluckPosts || post.kind !== "unluck") &&
      `${post.body} ${post.authorName} ${post.handle} ${post.probability}`
        .toLocaleLowerCase()
        .includes(normalizedQuery),
    );

    if (activeTab === "latest") {
      return [...filtered].sort((first, second) => second.timestamp.localeCompare(first.timestamp));
    }

    return [...filtered].sort((first, second) => second.likes - first.likes);
  }, [activeTab, normalizedQuery, showUnluckPosts, posts]);

  async function toggleUserFollowing(user: ProfileUser) {
    if (!user.id || user.id === currentUserId) return;
    try {
      await toggleFollow(currentUserId, user.id, user.following);
      setUsers((current) => current.map((candidate) => candidate.id === user.id
        ? { ...candidate, following: !candidate.following, followerCount: candidate.followerCount + (candidate.following ? -1 : 1) }
        : candidate));
    } catch {
      setUsersError("フォロー状態を更新できませんでした。時間をおいて再度お試しください。");
    }
  }

  return (
    <div className="app-shell">
      <div className="search-top">
        <AppHeader showBottomLine={false} onMyProfileClick={onOpenMyProfile} avatarUrl={avatarUrl} />
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
            {users.map((user) => (
              <article className="search-user" key={user.handle}>
                <button
                  className={`search-user__avatar search-user__avatar-button${user.avatarUrl ? " has-avatar" : ""}`}
                  type="button"
                  aria-label={`${user.name}のプロフィールを開く`}
                  style={user.avatarUrl ? { backgroundImage: `url("${user.avatarUrl}")` } : undefined}
                  onClick={() => onOpenProfile(user.handle)}
                />
                <div className="search-user__identity">
                  <button
                    className="search-user__profile-open"
                    type="button"
                    onClick={() => onOpenProfile(user.handle)}
                    aria-label={`${user.name} ${user.handle}のプロフィールを開く`}
                  >
                    <strong>{user.name}</strong>
                    <span>{user.handle}</span>
                  </button>
                  <p>{user.bio}</p>
                </div>
                <button
                  className={`search-user__follow${user.following ? " is-following" : ""}`}
                  type="button"
                  aria-pressed={user.following}
                  disabled={!user.id || user.id === currentUserId}
                  onClick={() => void toggleUserFollowing(user)}
                >
                  {user.id === currentUserId ? "自分" : user.following ? "フォロー中" : "フォローする"}
                </button>
              </article>
            ))}
            {usersError ? <p className="search-empty" role="alert">{usersError}</p> : users.length === 0 && <p className="search-empty">ユーザーが見つかりません</p>}
          </section>
        ) : matchingPosts.length > 0 ? (
          <TimelineFeed
            posts={matchingPosts}
            onLikeChange={onLikeChange}
            onOpenProfile={onOpenProfile}
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
