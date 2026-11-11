import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import AppHeader from "../components/layout/AppHeader";
import BottomNavigation, { type NavigationItem } from "../components/layout/BottomNavigation";
import PostKindSwitch from "../features/post-create/components/PostKindSwitch";
import ProbabilityInput from "../features/post-create/components/ProbabilityInput";
import type { PostKind } from "../features/timeline/types";
import type { PostCreatePrefill, PostDraft } from "../features/post-create/types";

type PostCreatePageProps = {
  activeItem: NavigationItem;
  onNavigationChange: (item: NavigationItem) => void;
  hasUnreadNotifications: boolean;
  onCancel: () => void;
  onPublish: (draft: PostDraft) => Promise<void>;
  onOpenMyProfile: () => void;
  prefill?: PostCreatePrefill;
};

export default function PostCreatePage({
  activeItem,
  onNavigationChange,
  hasUnreadNotifications,
  onCancel,
  onPublish,
  onOpenMyProfile,
  prefill,
}: PostCreatePageProps) {
  const [kind, setKind] = useState<PostKind>(prefill?.kind ?? "luck");
  const [probabilityLabel, setProbabilityLabel] = useState(prefill?.probability ?? "20%");
  const [body, setBody] = useState(prefill?.body ?? "");
  const [imagePreview, setImagePreview] = useState("");
  const [imageFile, setImageFile] = useState<File>();
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState("");

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPublishError("");
    setIsPublishing(true);
    try {
      await onPublish({ kind, probability: probabilityLabel, body, image: imageFile });
    } catch {
      setPublishError("投稿を保存できませんでした。入力と接続設定を確認してください。");
    } finally {
      setIsPublishing(false);
    }
  }

  return (
    <div className="app-shell">
      <div className="post-create-top">
        <AppHeader showBottomLine={false} onMyProfileClick={onOpenMyProfile} />
        <h1 className="post-create-title">投稿</h1>
      </div>

      <main className="post-create-content">
        <form
          className="post-create-form"
          onSubmit={handleSubmit}
        >
          <div className="post-create-actions">
            <button className="post-create-actions__cancel" type="button" onClick={onCancel}>
              キャンセル
            </button>
            <button
              className="post-create-actions__publish"
              type="submit"
              disabled={!body.trim() || isPublishing}
            >
              {isPublishing ? "保存中…" : "投稿"}
            </button>
          </div>

          <section className="post-create-section">
            <h2>投稿形式（幸運／不幸）</h2>
            <PostKindSwitch kind={kind} onChange={setKind} />
          </section>

          <ProbabilityInput
            initialValue={prefill?.probability}
            onProbabilityChange={setProbabilityLabel}
          />

          <div className="post-create-probability-summary">
            <span>確率</span>
            <strong>{probabilityLabel}</strong>
          </div>

          <div className="post-create-body-field">
            <label className="post-create-body-label" htmlFor="post-body">本文</label>
            <textarea
              id="post-body"
              className="post-create-body"
              placeholder="幸運/不幸な出来事を書いてみよう"
              value={body}
              onChange={(event) => setBody(event.target.value)}
              aria-label="投稿本文"
            />
          </div>

          <div className="post-create-image-field">
            <label className="post-create-image" htmlFor="post-image">
              <span className="post-create-image__icon" aria-hidden="true" />
              <span>画像を追加</span>
            </label>
            <input
              id="post-image"
              className="visually-hidden"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
            />
            {imagePreview && (
              <div className="post-create-image__attachment">
                <img src={imagePreview} alt="投稿画像のプレビュー" />
                <button type="button" onClick={() => { setImagePreview(""); setImageFile(undefined); }}>画像を削除</button>
              </div>
            )}
          </div>
          {publishError && <p className="post-create-error" role="alert">{publishError}</p>}
        </form>
      </main>

      <BottomNavigation
        activeItem={activeItem}
        onSelect={onNavigationChange}
        hasUnreadNotifications={hasUnreadNotifications}
      />
    </div>
  );
}
