import { useEffect, useLayoutEffect, useRef, useState } from "react";
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
import ProfileSetupPage from "./pages/ProfileSetupPage";
import type { ProfileUser } from "./features/profile/types";
import type { PostCreatePrefill } from "./features/post-create/types";
import { isSupabaseConfigured, supabase } from "./lib/supabase";
import { createPost, fetchPosts, setPostLike } from "./features/timeline/data/postsApi";
import type { TimelinePost } from "./features/timeline/types";
import type { PostDraft } from "./features/post-create/types";
import { fetchMyProfile, fetchFollowingIds, fetchProfileByHandle, completeProfileSetup, updateMyProfile, toggleFollow, type AccountProfile } from "./features/profile/data/profileApi";
import { fetchNotifications, markNotificationsRead } from "./features/notifications/data/notificationsApi";
import type { NotificationItem } from "./features/notifications/types";
import type { Session } from "@supabase/supabase-js";

const guestLoginEnabled = import.meta.env.VITE_ENABLE_GUEST_LOGIN !== "false";

function getHandleForPath(pathname: string): string | null {
  const match = pathname.match(/^\/users\/([^/]+)\/?$/);
  if (!match) return null;
  let handle = match[1];
  try { handle = decodeURIComponent(handle); } catch { /* Keep malformed URL text for lookup. */ }
  return handle.replace(/^@/, "");
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
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
  const [showUnluckPosts, setShowUnluckPosts] = useState(true);
  const [showNotificationBadge, setShowNotificationBadge] = useState(false);
  const [isCreatingPost, setIsCreatingPost] = useState(initialPath === "/posts/new");
  const [postPrefill, setPostPrefill] = useState<PostCreatePrefill | null>(null);
  const [profileUser, setProfileUser] = useState<ProfileUser | null>(null);
  const [profilePosts, setProfilePosts] = useState<TimelinePost[]>([]);
  const [myPosts, setMyPosts] = useState<TimelinePost[]>([]);
  const [isUserProfileLoading, setIsUserProfileLoading] = useState(false);
  const [userProfileError, setUserProfileError] = useState("");
  const profileRequestId = useRef(0);
  const [isMyProfileOpen, setIsMyProfileOpen] = useState(initialPath === "/profile");
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isProfileReady, setIsProfileReady] = useState(false);
  const [accountProfile, setAccountProfile] = useState<AccountProfile | null>(null);
  const [authError, setAuthError] = useState("");
  const [isGuestSigningIn, setIsGuestSigningIn] = useState(false);
  const [profileLoadError, setProfileLoadError] = useState("");
  const [posts, setPosts] = useState<TimelinePost[]>([]);
  const [followingUserIds, setFollowingUserIds] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [scrollRestoreY, setScrollRestoreY] = useState<number | null>(null);

  useEffect(() => {
    let requestId = 0;
    let loadedSessionUserId: string | null | undefined;
    async function loadSession(session: Session | null) {
      const sessionUserId = session?.user.id ?? null;
      if (loadedSessionUserId === sessionUserId) return;
      loadedSessionUserId = sessionUserId;

      const currentRequest = ++requestId;
      setIsSignedIn(Boolean(session));
      setIsAuthReady(true);
      if (!session) {
        setIsProfileReady(false);
        setAccountProfile(null);
        setProfileLoadError("");
        setPosts([]);
        setFollowingUserIds([]);
        setNotifications([]);
        setHasUnreadNotifications(false);
        window.history.replaceState({}, "", "/signin");
        return;
      }

      setIsProfileReady(false);
      setFollowingUserIds([]);
      try {
        const profile = await fetchMyProfile(session.user.id);
        if (currentRequest !== requestId) return;
        setAccountProfile(profile);
        setIsProfileReady(true);
        setProfileLoadError("");
        const [postsResult, myPostsResult, notificationsResult, followingResult] = await Promise.allSettled([
          fetchPosts(session.user.id),
          fetchPosts(session.user.id, session.user.id),
          fetchNotifications(session.user.id),
          fetchFollowingIds(session.user.id),
        ]);
        if (currentRequest !== requestId) return;
        if (postsResult.status === "fulfilled") setPosts(postsResult.value);
        if (myPostsResult.status === "fulfilled") setMyPosts(myPostsResult.value);
        if (notificationsResult.status === "fulfilled") {
          setNotifications(notificationsResult.value.items);
          setHasUnreadNotifications(notificationsResult.value.hasUnread);
        }
        if (followingResult.status === "fulfilled") setFollowingUserIds(followingResult.value);
      } catch {
        if (currentRequest !== requestId) return;
        loadedSessionUserId = undefined;
        setProfileLoadError("プロフィールを読み込めませんでした。Supabaseの設定とマイグレーションを確認してください。");
        setIsProfileReady(true);
      }
    }

    if (!supabase) {
      setIsAuthReady(true);
      window.history.replaceState({}, "", "/signin");
      return;
    }

    void supabase.auth.getSession().then(({ data, error }) => {
      if (error) setAuthError("サインイン状態を確認できませんでした。もう一度お試しください。");
      void loadSession(data.session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      window.setTimeout(() => void loadSession(session), 0);
    });
    return () => { requestId += 1; subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    function handlePopState(event: PopStateEvent) {
      if (!isSignedIn) {
        window.history.replaceState({}, "", "/signin");
        return;
      }
      const pathname = window.location.pathname;
      const profileHandle = getHandleForPath(pathname);
      if (profileHandle) void loadUserProfile(profileHandle);
      else {
        profileRequestId.current += 1;
        setProfileUser(null);
        setProfilePosts([]);
        setIsUserProfileLoading(false);
        setUserProfileError("");
      }
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
  }, [isSignedIn, accountProfile?.id]);

  useEffect(() => {
    const handle = isSignedIn ? getHandleForPath(window.location.pathname) : null;
    if (handle && accountProfile) void loadUserProfile(handle);
  }, [isSignedIn, accountProfile?.id]);

  useLayoutEffect(() => {
    if (scrollRestoreY === null) return;
    window.scrollTo(0, scrollRestoreY);
    setScrollRestoreY(null);
  }, [activeItem, isCreatingPost, isMyProfileOpen, profileUser, scrollRestoreY]);

  async function loadUserProfile(handle: string) {
    if (!accountProfile) return;
    const requestId = ++profileRequestId.current;
    setProfileUser(null);
    setProfilePosts([]);
    setUserProfileError("");
    setIsUserProfileLoading(true);
    try {
      const user = await fetchProfileByHandle(handle, accountProfile.id);
      if (!user) throw new Error("Profile not found");
      const userPosts = await fetchPosts(accountProfile.id, user.id);
      if (requestId !== profileRequestId.current) return;
      setProfileUser(user);
      setProfilePosts(userPosts);
    } catch {
      if (requestId === profileRequestId.current) setUserProfileError("プロフィールを読み込めませんでした。");
    } finally {
      if (requestId === profileRequestId.current) setIsUserProfileLoading(false);
    }
  }

  function handleNavigationChange(item: NavigationItem) {
    if (!isSignedIn) return;
    profileRequestId.current += 1;
    setIsUserProfileLoading(false);
    setUserProfileError("");
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
      setNotifications((items) => items.map((item) => ({ ...item, isRead: true })));
      if (supabase) {
        void supabase.auth.getUser().then(({ data }) => {
          if (data.user) void markNotificationsRead(data.user.id).catch(() => undefined);
        });
      }
    }

    setActiveItem(item);
    window.scrollTo(0, 0);
  }

  function openPostComposer(prefill?: PostCreatePrefill) {
    profileRequestId.current += 1;
    window.history.replaceState(
      { ...window.history.state, activeItem, scrollY: window.scrollY },
      "",
      window.location.pathname,
    );
    window.history.pushState({ activeItem, composer: true, scrollY: 0 }, "", "/posts/new");
    setPostPrefill(prefill ?? null);
    setProfileUser(null);
    setIsUserProfileLoading(false);
    setIsMyProfileOpen(false);
    setIsCreatingPost(true);
    window.scrollTo(0, 0);
  }

  function openUserProfile(handle: string) {
    window.history.replaceState(
      { ...window.history.state, activeItem, scrollY: window.scrollY },
      "",
      window.location.href,
    );
    window.history.pushState({ activeItem, profileHandle: handle }, "", getProfilePath(handle));
    setIsCreatingPost(false);
    setIsMyProfileOpen(false);
    void loadUserProfile(handle);
  }

  function openMyProfile() {
    profileRequestId.current += 1;
    window.history.replaceState(
      { ...window.history.state, activeItem, scrollY: window.scrollY },
      "",
      window.location.href,
    );
    window.history.pushState({ activeItem, myProfile: true }, "", "/profile");
    setIsCreatingPost(false);
    setProfileUser(null);
    setIsUserProfileLoading(false);
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

  async function handleGuestSignIn() {
    if (!supabase) {
      setAuthError("Supabaseの接続設定が必要です。");
      return;
    }
    setAuthError("");
    setIsGuestSigningIn(true);
    try {
      const { error } = await supabase.auth.signInAnonymously();
      if (error) throw error;
    } catch {
      setAuthError("ゲストログインできませんでした。Supabaseで匿名ログインを有効にして、もう一度お試しください。");
    } finally {
      setIsGuestSigningIn(false);
    }
  }

  async function handlePublishPost(draft: PostDraft) {
    const post = await createPost(draft);
    setPosts((currentPosts) => [post, ...currentPosts]);
    if (post.handle === `@${accountProfile?.handle}`) setMyPosts((currentPosts) => [post, ...currentPosts]);
    closePostComposer();
  }

  async function handleProfileSetup(input: { displayName: string; handle: string; avatar?: File | null }) {
    const savedProfile = await completeProfileSetup(input);
    setAccountProfile(savedProfile);
    setActiveItem("home");
    setIsProfileReady(true);
    window.history.replaceState({ activeItem: "home" }, "", "/");
    window.scrollTo(0, 0);
  }

  async function handleProfileSave(input: { displayName: string; handle: string; bio: string; avatar?: File | null }) {
    const savedProfile = await updateMyProfile(input);
    setAccountProfile(savedProfile);
    const refreshedPosts = await fetchPosts(savedProfile.id, savedProfile.id);
    setMyPosts(refreshedPosts);
    const previousHandle = accountProfile?.handle;
    setPosts((currentPosts) => currentPosts.map((post) => previousHandle && post.handle === `@${previousHandle}`
      ? { ...post, authorName: savedProfile.display_name, handle: `@${savedProfile.handle}` }
      : post));
  }

  async function handleFollowToggle(targetUserId: string, isFollowing: boolean) {
    if (!accountProfile) throw new Error("Sign in is required.");
    await toggleFollow(accountProfile.id, targetUserId, isFollowing);
    setFollowingUserIds((current) => isFollowing
      ? current.filter((id) => id !== targetUserId)
      : current.includes(targetUserId) ? current : [...current, targetUserId]);
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
    setAccountProfile(null);
    setIsProfileReady(false);
    setNotifications([]);
    setHasUnreadNotifications(false);
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
        onGuestSignIn={() => void handleGuestSignIn()}
        disabled={!isSupabaseConfigured}
        guestLoginEnabled={guestLoginEnabled}
        guestDisabled={!isSupabaseConfigured || isGuestSigningIn}
        error={authError || (!isSupabaseConfigured ? "Supabaseの接続設定が必要です。frontend/.env.local を設定してください。" : "")}
      />
    ) : !isProfileReady ? (
      <div className="profile-setup-loading" role="status">プロフィールを読み込み中…</div>
    ) : profileLoadError ? (
      <main className="profile-setup-content">
        <section className="profile-setup-form" role="alert">
          <h1>プロフィールを読み込めません</h1>
          <p>{profileLoadError}</p>
          <button type="button" onClick={() => void handleLogout()}>ログイン画面に戻る</button>
        </section>
      </main>
    ) : accountProfile && !accountProfile.is_onboarded ? (
      <ProfileSetupPage profile={accountProfile} onSave={handleProfileSetup} />
    ) : isCreatingPost ? (
      <PostCreatePage
        activeItem={activeItem}
        onNavigationChange={handleNavigationChange}
        hasUnreadNotifications={hasUnreadNotifications && showNotificationBadge}
        onCancel={closePostComposer}
        onPublish={handlePublishPost}
        onOpenMyProfile={openMyProfile}
        avatarUrl={accountProfile?.avatar_url ?? null}
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
        currentUserId={accountProfile?.id ?? ""}
        avatarUrl={accountProfile?.avatar_url ?? null}
      />
    ) : activeItem === "notifications" ? (
      <NotificationsPage
        activeItem={activeItem}
        onNavigationChange={handleNavigationChange}
        hasUnreadNotifications={hasUnreadNotifications && showNotificationBadge}
        onCreatePost={openPostComposer}
        onOpenMyProfile={openMyProfile}
        avatarUrl={accountProfile?.avatar_url ?? null}
        notifications={notifications}
      />
    ) : activeItem === "gacha" ? (
      <GachaPage
        activeItem={activeItem}
        onNavigationChange={handleNavigationChange}
        hasUnreadNotifications={hasUnreadNotifications && showNotificationBadge}
        onOpenMyProfile={openMyProfile}
        onCreatePost={openPostComposer}
        avatarUrl={accountProfile?.avatar_url ?? null}
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
        avatarUrl={accountProfile?.avatar_url ?? null}
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
      avatarUrl={accountProfile?.avatar_url ?? null}
      allPosts={posts}
      followingUserIds={followingUserIds}
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
            posts={profilePosts}
            onLikeChange={setPostLike}
            onToggleFollow={handleFollowToggle}
            currentUserId={accountProfile?.id ?? ""}
            currentAvatarUrl={accountProfile?.avatar_url ?? null}
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
      {isUserProfileLoading && <div className="route-overlay profile-setup-loading" role="status">プロフィールを読み込み中…</div>}
      {userProfileError && <div className="route-overlay"><main className="profile-setup-content"><section className="profile-setup-form" role="alert"><p>{userProfileError}</p><button type="button" onClick={() => { setUserProfileError(""); window.history.back(); }}>戻る</button></section></main></div>}
      {isMyProfileOpen && (
        <div className="route-overlay">
          <MyProfilePage
            activeItem={activeItem}
            onNavigationChange={handleNavigationChange}
            hasUnreadNotifications={hasUnreadNotifications && showNotificationBadge}
            showUnluckPosts={showUnluckPosts}
            onCreatePost={openPostComposer}
            profile={accountProfile!}
            posts={myPosts}
            onSave={handleProfileSave}
            onLikeChange={setPostLike}
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
