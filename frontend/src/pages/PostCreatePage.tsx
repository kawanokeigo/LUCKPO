import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
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
  avatarUrl: string | null;
};

const postDraftStorageKey = "luckpo-post-create-draft";
const postDraftDatabaseName = "luckpo-post-create-draft";
const postDraftImageStoreName = "images";

function readSavedDraft(): Partial<PostCreatePrefill> {
  try {
    const saved = sessionStorage.getItem(postDraftStorageKey);
    if (!saved) return {};
    const parsed = JSON.parse(saved) as Partial<PostCreatePrefill>;
    return {
      ...(parsed.kind === "luck" || parsed.kind === "unluck" ? { kind: parsed.kind } : {}),
      ...(typeof parsed.probability === "string" ? { probability: parsed.probability } : {}),
      ...(typeof parsed.body === "string" ? { body: parsed.body } : {}),
    };
  } catch {
    return {};
  }
}

function openPostDraftDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(postDraftDatabaseName, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(postDraftImageStoreName)) {
        request.result.createObjectStore(postDraftImageStoreName);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function storePostDraftImage(file: File | null) {
  const database = await openPostDraftDatabase();
  return new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(postDraftImageStoreName, "readwrite");
    const store = transaction.objectStore(postDraftImageStoreName);
    if (file) store.put(file, "selected");
    else store.delete("selected");
    transaction.oncomplete = () => { database.close(); resolve(); };
    transaction.onerror = () => { database.close(); reject(transaction.error); };
    transaction.onabort = () => { database.close(); reject(transaction.error); };
  });
}

async function readPostDraftImage(): Promise<File | undefined> {
  const database = await openPostDraftDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(postDraftImageStoreName, "readonly");
    const request = transaction.objectStore(postDraftImageStoreName).get("selected");
    request.onsuccess = () => { database.close(); resolve(request.result as File | undefined); };
    request.onerror = () => { database.close(); reject(request.error); };
  });
}

export default function PostCreatePage({
  activeItem,
  onNavigationChange,
  hasUnreadNotifications,
  onCancel,
  onPublish,
  onOpenMyProfile,
  prefill,
  avatarUrl,
}: PostCreatePageProps) {
  const [savedDraft] = useState(readSavedDraft);
  const [kind, setKind] = useState<PostKind>(savedDraft.kind ?? prefill?.kind ?? "luck");
  const [probabilityLabel, setProbabilityLabel] = useState(savedDraft.probability ?? prefill?.probability ?? "20%");
  const [body, setBody] = useState(savedDraft.body ?? prefill?.body ?? "");
  const [imagePreview, setImagePreview] = useState("");
  const [imageFile, setImageFile] = useState<File>();
  const [imageError, setImageError] = useState("");
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState("");

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  useEffect(() => {
    try {
      sessionStorage.setItem(postDraftStorageKey, JSON.stringify({ kind, probability: probabilityLabel, body }));
    } catch {
      // Keep the composer usable if browser storage is unavailable.
    }
  }, [kind, probabilityLabel, body]);

  useEffect(() => {
    let cancelled = false;
    void readPostDraftImage().then((file) => {
      if (cancelled || !file) return;
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }).catch(() => undefined);
    return () => { cancelled = true; };
  }, []);

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = event.target.files?.[0];
    if (!file) return;
    input.value = "";

    const supportedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!supportedTypes.includes(file.type)) {
      setImageError("JPEG・PNG・WebP・GIF形式の画像を選んでください。");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setImageError("画像は10MB以下のファイルを選んでください。");
      return;
    }

    setImageError("");
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    void storePostDraftImage(file).catch(() => {
      setImageError("画像を一時保存できませんでした。画面を閉じずに投稿してください。");
    });
  }

  function removeImage() {
    setImageFile(undefined);
    setImagePreview("");
    setImageError("");
    void storePostDraftImage(null).catch(() => undefined);
  }

  function clearSavedDraft() {
    try {
      sessionStorage.removeItem(postDraftStorageKey);
    } catch {
      // Ignore unavailable browser storage.
    }
    void storePostDraftImage(null).catch(() => undefined);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPublishError("");
    setIsPublishing(true);
    try {
      await onPublish({ kind, probability: probabilityLabel, body, image: imageFile });
      clearSavedDraft();
    } catch {
      setPublishError("投稿を保存できませんでした。入力と接続設定を確認してください。");
    } finally {
      setIsPublishing(false);
    }
  }

  function handleCancel() {
    clearSavedDraft();
    onCancel();
  }

  return (
    <div className="app-shell">
      <div className="post-create-top">
        <AppHeader showBottomLine={false} onMyProfileClick={onOpenMyProfile} avatarUrl={avatarUrl} />
        <h1 className="post-create-title">投稿</h1>
      </div>

      <main className="post-create-content">
        <form
          className="post-create-form"
          onSubmit={handleSubmit}
        >
          <div className="post-create-actions">
            <button className="post-create-actions__cancel" type="button" onClick={handleCancel}>
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
            <button className="post-create-image" type="button" onClick={() => imageInputRef.current?.click()}>
              <span className="post-create-image__icon" aria-hidden="true" />
              <span>画像を追加</span>
            </button>
            <input
              ref={imageInputRef}
              id="post-image"
              className="visually-hidden"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleImageChange}
            />
            {imagePreview && imageFile && (
              <div className="post-create-image__attachment">
                <img src={imagePreview} alt={`${imageFile.name}のプレビュー`} />
                <div className="post-create-image__details">
                  <span className="post-create-image__name">{imageFile.name}</span>
                  <button type="button" aria-label="選択した画像を削除" onClick={removeImage}>画像を削除</button>
                </div>
              </div>
            )}
            {imageError && <p className="post-create-error" role="alert">{imageError}</p>}
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
