import { useState, type ChangeEvent, type FormEvent } from "react";
import AppHeader from "../components/layout/AppHeader";
import type { AccountProfile } from "../features/profile/data/profileApi";

type ProfileSetupPageProps = {
  profile: AccountProfile;
  onSave: (input: { displayName: string; handle: string; avatar?: File | null }) => Promise<void>;
};

export default function ProfileSetupPage({ profile, onSave }: ProfileSetupPageProps) {
  const [displayName, setDisplayName] = useState(profile.display_name);
  const [handle, setHandle] = useState(profile.handle);
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  function selectAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError("画像は10MB以下にしてください。");
      event.target.value = "";
      return;
    }
    if (!/[.]((jpe?g)|(png)|(webp)|(gif))$/i.test(file.name)) {
      setError("JPEG、PNG、WebP、GIF形式の画像を選んでください。");
      event.target.value = "";
      return;
    }
    setAvatar(file);
    setError("");
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setAvatarPreview(reader.result);
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedHandle = handle.replace(/^@/, "").trim();
    if (!/^[a-zA-Z0-9_]{3,24}$/.test(normalizedHandle)) {
      setError("ユーザーIDは半角英数字と_を使った3〜24文字にしてください。");
      return;
    }
    if (!displayName.trim()) {
      setError("ユーザー名を入力してください。");
      return;
    }
    setError("");
    setIsSaving(true);
    try {
      await onSave({ displayName, handle: normalizedHandle, avatar });
    } catch (saveError) {
      const dbError = saveError as { code?: string; message?: string };
      setError(dbError.code === "23505" || dbError.message?.includes("duplicate key")
        ? "このユーザーIDはすでに使われています。"
        : "保存できませんでした。画像の形式やSupabaseの設定を確認してください。");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="app-shell profile-setup-shell">
      <div className="profile-setup-top"><AppHeader showProfileIcon={false} showBottomLine /></div>
      <main className="profile-setup-content">
        <form className="profile-setup-form" onSubmit={(event) => void submit(event)}>
          <h1>プロフィールを設定</h1>
          <p>LUCKPOで使う名前とユーザーIDを決めましょう。</p>
          <div className={`profile-setup-avatar${avatarPreview ? " has-avatar" : ""}`} style={avatarPreview ? { backgroundImage: `url("${avatarPreview}")` } : undefined} role="img" aria-label={avatarPreview ? "選択したプロフィールアイコン" : "未設定のプロフィールアイコン"} />
          <label className="profile-setup-avatar-picker">
            アイコンを選択（任意）
            <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={selectAvatar} />
          </label>
          <small className="profile-setup-avatar-help">設定しない場合は仮アイコンを使います。</small>
          <label>
            ユーザー名
            <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={30} autoComplete="name" required />
          </label>
          <label>
            ユーザーID
            <div className="profile-setup-handle"><span>@</span><input value={handle.replace(/^@/, "")} onChange={(event) => setHandle(event.target.value)} maxLength={24} autoComplete="username" required /></div>
            <small>半角英数字と_が使えます（3〜24文字）</small>
          </label>
          {error && <p className="profile-setup-error" role="alert">{error}</p>}
          <button type="submit" disabled={isSaving}>{isSaving ? "保存中…" : "設定してはじめる"}</button>
        </form>
      </main>
    </div>
  );
}
