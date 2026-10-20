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
import type { ProfileUser } from "./features/profile/types";
import { mockUsers } from "./features/profile/data/mockUsers";

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
  const [profileUser, setProfileUser] = useState<ProfileUser | null>(() => getUserForPath(initialPath));
  const [isMyProfileOpen, setIsMyProfileOpen] = useState(initialPath === "/profile");
  const [scrollRestoreY, setScrollRestoreY] = useState<number | null>(null);

  useEffect(() => {
    function handlePopState(event: PopStateEvent) {
      const pathname = window.location.pathname;
      setProfileUser(getUserForPath(pathname));
      setIsMyProfileOpen(pathname === "/profile");
      setIsCreatingPost(pathname === "/posts/new");
      const pathItem = getNavigationForPath(pathname);
      if (pathItem) setActiveItem(pathItem);
      else if (event.state?.activeItem) setActiveItem(event.state.activeItem as NavigationItem);
      setScrollRestoreY(typeof event.state?.scrollY === "number" ? event.state.scrollY : 0);
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useLayoutEffect(() => {
    if (scrollRestoreY === null) return;
    window.scrollTo(0, scrollRestoreY);
    setScrollRestoreY(null);
  }, [activeItem, isCreatingPost, isMyProfileOpen, profileUser, scrollRestoreY]);

  function handleNavigationChange(item: NavigationItem) {
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

  function openPostComposer() {
    window.history.replaceState(
      { ...window.history.state, activeItem, scrollY: window.scrollY },
      "",
      window.location.pathname,
    );
    window.history.pushState({ activeItem, composer: true, scrollY: 0 }, "", "/posts/new");
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
    if (window.history.state?.composer) {
      window.history.back();
    } else {
      window.history.replaceState({ activeItem, scrollY: 0 }, "", navigationPaths[activeItem]);
      setIsCreatingPost(false);
      window.scrollTo(0, 0);
    }
  }

  const basePage = isCreatingPost ? (
      <PostCreatePage
        activeItem={activeItem}
        onNavigationChange={handleNavigationChange}
        hasUnreadNotifications={hasUnreadNotifications && showNotificationBadge}
        onCancel={closePostComposer}
        onPublish={closePostComposer}
        onOpenMyProfile={openMyProfile}
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
