import { useState, type ChangeEvent, type FormEvent } from "react";
import AppHeader from "../components/layout/AppHeader";
import BottomNavigation, { type NavigationItem } from "../components/layout/BottomNavigation";
import CreatePostButton from "../components/navigation/CreatePostButton";
import TimelineFeed from "../features/timeline/components/TimelineFeed";
import { mockPosts } from "../features/timeline/data/mockPosts";

type MyProfilePageProps = {
  activeItem: NavigationItem;
  onNavigationChange: (item: NavigationItem) => void;
  hasUnreadNotifications: boolean;
  showUnluckPosts: boolean;
  onCreatePost: () => void;
  onBack: () => void;
};

type ProfileDetails = {
  name: string;
  handle: string;
  bio: string;
};

const initialProfile: ProfileDetails = {
  name: "自分自身",
  handle: "@yourSelf",
  bio: "ここにプロフィールが入ります\nここに2行目のプロフィールが入ります",
};

export default function MyProfilePage({
  activeItem,
  onNavigationChange,
  hasUnreadNotifications,
  showUnluckPosts,
  onCreatePost,
  onBack,
}: MyProfilePageProps) {
  const [profile, setProfile] = useState(initialProfile);
  const [draft, setDraft] = useState(initialProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [avatarImage, setAvatarImage] = useState("");
  const [draftAvatarImage, setDraftAvatarImage] = useState("");

  const posts = mockPosts
    .filter((post) => showUnluckPosts || post.kind !== "unluck")
    .map((post) => ({ ...post, authorName: profile.name, handle: profile.handle }));

  function beginEditing() {
    setDraft(profile);
    setDraftAvatarImage(avatarImage);
    setIsEditing(true);
  }

  function changeAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setDraftAvatarImage(reader.result);
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  }

  function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProfile(draft);
    setAvatarImage(draftAvatarImage);
    setIsEditing(false);
  }

  return (
    <div className="app-shell">
      <div className="user-profile-top">
        <AppHeader showBottomLine />
        <section className="user-profile-summary" aria-label="マイプロフィール">
          <div className="user-profile-summary__top">
            <div
              className="user-profile-summary__avatar"
              style={avatarImage ? { backgroundImage: `url("${avatarImage}")` } : undefined}
              aria-hidden="true"
            />
            <div className="user-profile-summary__identity">
              <h1>{profile.name}</h1>
              <span>{profile.handle}</span>
            </div>
            <button
              className="user-profile-back"
              type="button"
              aria-label="前の画面に戻る"
              onClick={onBack}
            >
              <img className="user-profile-back__icon" src="/images/return.svg" alt="" />
            </button>
          </div>
          <p className="user-profile-summary__bio">{profile.bio}</p>
          <p className="user-profile-summary__counts">
            <span><strong>10</strong> フォロー中</span>
            <span><strong>11</strong> フォロワー</span>
          </p>

          {!isEditing ? (
            <button className="my-profile-edit-trigger" type="button" onClick={beginEditing}>
              プロフィールを編集
            </button>
          ) : (
            <form className="my-profile-editor" onSubmit={saveProfile}>
              <div className="my-profile-avatar-edit">
                <div
                  className="my-profile-avatar-edit__preview"
                  style={draftAvatarImage ? { backgroundImage: `url("${draftAvatarImage}")` } : undefined}
                  aria-hidden="true"
                />
                <label className="my-profile-avatar-edit__picker">
                  アイコンを変更
                  <input
                    className="visually-hidden"
                    type="file"
                    accept="image/*"
                    onChange={changeAvatar}
                  />
                </label>
              </div>
              <label>
                ユーザー名
                <input
                  type="text"
                  maxLength={30}
                  value={draft.name}
                  onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                />
              </label>
              <label>
                ユーザーID
                <input
                  type="text"
                  maxLength={30}
                  value={draft.handle}
                  onChange={(event) => setDraft({ ...draft, handle: event.target.value })}
                />
              </label>
              <label>
                プロフィール
                <textarea
                  rows={3}
                  maxLength={160}
                  value={draft.bio}
                  onChange={(event) => setDraft({ ...draft, bio: event.target.value })}
                />
              </label>
              <div className="my-profile-editor__actions">
                <button
                  type="button"
                  onClick={() => {
                    setDraftAvatarImage(avatarImage);
                    setIsEditing(false);
                  }}
                >
                  キャンセル
                </button>
                <button type="submit" disabled={!draft.name.trim() || !draft.handle.trim()}>
                  保存
                </button>
              </div>
            </form>
          )}
        </section>
        <div className="user-profile-posts-tab" aria-current="page">投稿</div>
      </div>

      <main className="user-profile-content" aria-label="自分の投稿">
        {posts.length ? (
          <TimelineFeed posts={posts} />
        ) : (
          <p className="user-profile-empty">投稿がまだありません。</p>
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
