import { useEffect, useLayoutEffect, useState } from "react";
import type { NavigationItem } from "./components/layout/BottomNavigation";
import HomePage from "./pages/HomePage";
import NotificationsPage from "./pages/NotificationsPage";
import SearchPage from "./pages/SearchPage";
import SettingsPage from "./pages/SettingsPage";
import PostCreatePage from "./pages/PostCreatePage";
import UserProfilePage from "./pages/UserProfilePage";
import MyProfilePage from "./pages/MyProfilePage";
import GachaPage from "./pages/GachaPage";
import SignInPage from "./pages/SignInPage";
import type { ProfileUser } from "./features/profile/types";
import { mockUsers } from "./features/profile/data/mockUsers";
import type { PostCreatePrefill } from "./features/post-create/types";
import { isSupabaseConfigured, supabase } from "./lib/supabase";
import { createPost, fetchPosts, setPostLike } from "./features/timeline/data/postsApi";
import type { TimelinePost } from "./features/timeline/types";
import type { PostDraft } from "./features/post-create/types";

function getUserForPath(pathname: string): ProfileUser | null {
  const match = pathname.match(/^\/users\/([^/]+)\/?$/);
  if (!match) return null;

  let handlePart = match[1];
  try {
    handlePart = decodeURIComponent(handlePart);
  } catch {
    // Keep the undecoded segment and show a fallback profile for malformed URLs.
  }

  const handle = `@${handlePart.replace(/^@/, "")}`;
  return mockUsers.find((user) => user.handle.toLowerCase() === handle.toLowerCase()) ?? {
    name: "ユーザー",
    handle,
    bio: "プロフィールはまだありません",
    following: false,
    followingCount: 0,
    followerCount: 0,
  };
}

function getProfilePath(handle: string) {
  return `/users/${encodeURIComponent(handle.replace(/^@/, ""))}`;
}

const navigationPaths: Record<NavigationItem, string> = {
  home: "/",
  search: "/search",
  gacha: "/gacha",
  notifications: "/notifications",
  settings: "/settings",
};

function getNavigationForPath(pathname: string): NavigationItem | null {
  const entry = Object.entries(navigationPaths).find(([, path]) => path === pathname);
  return entry ? (entry[0] as NavigationItem) : null;
}

export default function App() {
  const initialPath = window.location.pathname;
  const [activeItem, setActiveItem] = useState<NavigationItem>(
    getNavigationForPath(initialPath) ?? window.history.state?.activeItem ?? "home",
  );
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(true);
  const [showUnluckPosts, setShowUnluckPosts] = useState(true);
  const [showNotificationBadge, setShowNotificationBadge] = useState(false);
  const [isCreatingPost, setIsCreatingPost] = useState(initialPath === "/posts/new");
  const [postPrefill, setPostPrefill] = useState<PostCreatePrefill | null>(null);
  const [profileUser, setProfileUser] = useState<ProfileUser | null>(() => getUserForPath(initialPath));
  const [isMyProfileOpen, setIsMyProfileOpen] = useState(initialPath === "/profile");
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [authError, setAuthError] = useState("");
  const [posts, setPosts] = useState<TimelinePost[]>([]);
  const [scrollRestoreY, setScrollRestoreY] = useState<number | null>(null);

  useEffect(() => {
    if (!supabase) {
      setIsAuthReady(true);
      window.history.replaceState({}, "", "/signin");
      return;
    }

    void supabase.auth.getSession().then(({ data, error }) => {
      if (error) setAuthError("サインイン状態を確認できませんでした。もう一度お試しください。");
      setIsSignedIn(Boolean(data.session));
      setIsAuthReady(true);
      if (data.session) {
        void fetchPosts(data.session.user.id).then(setPosts).catch(() => setAuthError("投稿を読み込めませんでした。"));
      } else window.history.replaceState({}, "", "/signin");
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsSignedIn(Boolean(session));
      setIsAuthReady(true);
      if (session) {
        void fetchPosts(session.user.id).then(setPosts).catch(() => setAuthError("投稿を読み込めませんでした。"));
      } else {
        setPosts([]);
        window.history.replaceState({}, "", "/signin");
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    function handlePopState(event: PopStateEvent) {
      if (!isSignedIn) {
        window.history.replaceState({}, "", "/signin");
        return;
      }
      const pathname = window.location.pathname;
      setProfileUser(getUserForPath(pathname));
      setIsMyProfileOpen(pathname === "/profile");
      setIsCreatingPost(pathname === "/posts/new");
      if (pathname !== "/posts/new") setPostPrefill(null);
      const pathItem = getNavigationForPath(pathname);
      if (pathItem) setActiveItem(pathItem);
      else if (event.state?.activeItem) setActiveItem(event.state.activeItem as NavigationItem);
      setScrollRestoreY(typeof event.state?.scrollY === "number" ? event.state.scrollY : 0);
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [isSignedIn]);

  useLayoutEffect(() => {
    if (scrollRestoreY === null) return;
    window.scrollTo(0, scrollRestoreY);
    setScrollRestoreY(null);
  }, [activeItem, isCreatingPost, isMyProfileOpen, profileUser, scrollRestoreY]);

  function handleNavigationChange(item: NavigationItem) {
    if (!isSignedIn) return;
    const currentPath = window.location.pathname;
    window.history.replaceState(
      { ...window.history.state, activeItem, scrollY: window.scrollY },
      "",
      currentPath,
    );

    const targetPath = navigationPaths[item];
    if (currentPath !== targetPath) {
      window.history.pushState({ activeItem: item, scrollY: 0 }, "", targetPath);
    } else {
      window.history.replaceState({ ...window.history.state, activeItem: item, scrollY: 0 }, "", targetPath);
    }
    setIsCreatingPost(false);
    setProfileUser(null);
    setIsMyProfileOpen(false);

    if (item === "notifications") {
      setHasUnreadNotifications(false);
    }

    setActiveItem(item);
    window.scrollTo(0, 0);
  }

  function openPostComposer(prefill?: PostCreatePrefill) {
    window.history.replaceState(
      { ...window.history.state, activeItem, scrollY: window.scrollY },
      "",
      window.location.pathname,
    );
    window.history.pushState({ activeItem, composer: true, scrollY: 0 }, "", "/posts/new");
    setPostPrefill(prefill ?? null);
    setProfileUser(null);
    setIsMyProfileOpen(false);
    setIsCreatingPost(true);
    window.scrollTo(0, 0);
  }

  function openUserProfile(user: ProfileUser) {
    window.history.replaceState(
      { ...window.history.state, activeItem, scrollY: window.scrollY },
      "",
      window.location.href,
    );
    window.history.pushState({ activeItem, profileHandle: user.handle }, "", getProfilePath(user.handle));
    setIsCreatingPost(false);
    setIsMyProfileOpen(false);
    setProfileUser(user);
  }

  function openMyProfile() {
    window.history.replaceState(
      { ...window.history.state, activeItem, scrollY: window.scrollY },
      "",
      window.location.href,
    );
    window.history.pushState({ activeItem, myProfile: true }, "", "/profile");
    setIsCreatingPost(false);
    setProfileUser(null);
    setIsMyProfileOpen(true);
  }

  function closePostComposer() {
    setPostPrefill(null);
    if (window.history.state?.composer) {
      window.history.back();
    } else {
      window.history.replaceState({ activeItem, scrollY: 0 }, "", navigationPaths[activeItem]);
      setIsCreatingPost(false);
      window.scrollTo(0, 0);
    }
  }

  async function handleSignIn() {
    if (!supabase) {
      setAuthError("Supabaseの接続設定が必要です。frontend/.env.local を設定してください。");
      return;
    }
    setAuthError("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) setAuthError("Googleでサインインできませんでした。設定を確認して再度お試しください。");
  }

  async function handlePublishPost(draft: PostDraft) {
    const post = await createPost(draft);
    setPosts((currentPosts) => [post, ...currentPosts]);
    closePostComposer();
  }

  async function handleLogout() {
    if (supabase) {
      const { error } = await supabase.auth.signOut();
      if (error) {
        setAuthError("ログアウトできませんでした。もう一度お試しください。");
        return;
      }
    }
    setIsSignedIn(false);
    setIsCreatingPost(false);
    setProfileUser(null);
    setIsMyProfileOpen(false);
    setPostPrefill(null);
    window.history.pushState({}, "", "/signin");
    window.scrollTo(0, 0);
  }

  const basePage = !isAuthReady || !isSignedIn ? (
      <SignInPage
        onSignIn={() => void handleSignIn()}
        disabled={!isSupabaseConfigured}
        error={authError || (!isSupabaseConfigured ? "Supabaseの接続設定が必要です。frontend/.env.local を設定してください。" : "")}
      />
    ) : isCreatingPost ? (
      <PostCreatePage
        activeItem={activeItem}
        onNavigationChange={handleNavigationChange}
        hasUnreadNotifications={hasUnreadNotifications && showNotificationBadge}
        onCancel={closePostComposer}
        onPublish={handlePublishPost}
        onOpenMyProfile={openMyProfile}
        prefill={postPrefill ?? undefined}
      />
    ) : activeItem === "search" ? (
      <SearchPage
        activeItem={activeItem}
        onNavigationChange={handleNavigationChange}
        hasUnreadNotifications={hasUnreadNotifications && showNotificationBadge}
        showUnluckPosts={showUnluckPosts}
        onCreatePost={openPostComposer}
        onOpenProfile={openUserProfile}
        onOpenMyProfile={openMyProfile}
        posts={posts}
        onLikeChange={setPostLike}
      />
    ) : activeItem === "notifications" ? (
      <NotificationsPage
        activeItem={activeItem}
        onNavigationChange={handleNavigationChange}
        hasUnreadNotifications={hasUnreadNotifications && showNotificationBadge}
        onCreatePost={openPostComposer}
        onOpenMyProfile={openMyProfile}
      />
    ) : activeItem === "gacha" ? (
      <GachaPage
        activeItem={activeItem}
        onNavigationChange={handleNavigationChange}
        hasUnreadNotifications={hasUnreadNotifications && showNotificationBadge}
        onOpenMyProfile={openMyProfile}
        onCreatePost={openPostComposer}
      />
    ) : activeItem === "settings" ? (
      <SettingsPage
        activeItem={activeItem}
        onNavigationChange={handleNavigationChange}
        showUnluckPosts={showUnluckPosts}
        onShowUnluckPostsChange={setShowUnluckPosts}
        showNotificationBadge={showNotificationBadge}
        onShowNotificationBadgeChange={setShowNotificationBadge}
        hasUnreadNotifications={hasUnreadNotifications && showNotificationBadge}
        onCreatePost={openPostComposer}
        onOpenMyProfile={openMyProfile}
        onLogout={handleLogout}
      />
    ) : (
    <HomePage
      activeItem={activeItem}
      onNavigationChange={handleNavigationChange}
      hasUnreadNotifications={hasUnreadNotifications && showNotificationBadge}
      showUnluckPosts={showUnluckPosts}
      onCreatePost={openPostComposer}
      onOpenProfile={openUserProfile}
      onOpenMyProfile={openMyProfile}
      allPosts={posts}
      onLikeChange={setPostLike}
    />
  );

  return (
    <>
      <div
        className={`route-base${profileUser || isMyProfileOpen ? " route-base--covered" : ""}`}
        aria-hidden={profileUser || isMyProfileOpen ? true : undefined}
      >
        {basePage}
      </div>
      {profileUser && (
        <div className="route-overlay" key={profileUser.handle}>
          <UserProfilePage
            user={profileUser}
            activeItem={activeItem}
            onNavigationChange={handleNavigationChange}
            hasUnreadNotifications={hasUnreadNotifications && showNotificationBadge}
            showUnluckPosts={showUnluckPosts}
            onCreatePost={openPostComposer}
            onBack={() => {
              if (window.location.pathname.startsWith("/users/") && window.history.state?.profileHandle) window.history.back();
              else {
                window.history.replaceState({ activeItem, scrollY: 0 }, "", navigationPaths[activeItem]);
                setProfileUser(null);
                window.scrollTo(0, 0);
              }
            }}
            onOpenMyProfile={openMyProfile}
          />
        </div>
      )}
      {isMyProfileOpen && (
        <div className="route-overlay">
          <MyProfilePage
            activeItem={activeItem}
            onNavigationChange={handleNavigationChange}
            hasUnreadNotifications={hasUnreadNotifications && showNotificationBadge}
            showUnluckPosts={showUnluckPosts}
            onCreatePost={openPostComposer}
            onBack={() => {
              if (window.location.pathname === "/profile" && window.history.state?.myProfile) window.history.back();
              else {
                window.history.replaceState({ activeItem, scrollY: 0 }, "", navigationPaths[activeItem]);
                setIsMyProfileOpen(false);
                window.scrollTo(0, 0);
              }
            }}
          />
        </div>
      )}
    </>
  );
}
