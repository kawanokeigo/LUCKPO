import { useState } from "react";
import type { TimelinePost } from "../types";

type PostCardProps = {
  post: TimelinePost;
  onOpenProfile?: (handle: string) => void;
};

function formatLikes(count: number) {
  return count >= 1_000 ? `${Math.floor(count / 1_000)}k` : String(count);
}

export default function PostCard({ post, onOpenProfile }: PostCardProps) {
  const [liked, setLiked] = useState(post.liked ?? false);
  const [likeCount, setLikeCount] = useState(post.likes);
  const kindLabel = post.kind === "luck" ? "幸運" : "不幸";

  function toggleLike() {
    setLiked(!liked);
    setLikeCount((count) => count + (liked ? -1 : 1));
  }

  function sharePost() {
    if (navigator.share) {
      void navigator.share({
        title: "LUCKPO",
        text: post.body,
        url: window.location.href,
      }).catch(() => undefined);
    }
  }

  return (
    <article className={`post-card post-card--${post.kind}`}>
      <div className="post-card__top">
        {onOpenProfile ? (
          <button
            className="post-card__avatar post-card__avatar-button"
            type="button"
            aria-label={`${post.authorName}のプロフィールを開く`}
            onClick={() => onOpenProfile(post.handle)}
          />
        ) : (
          <div className="post-card__avatar" role="img" aria-label={`${post.authorName}のアイコン`} />
        )}
        <div className="post-card__identity">
          {onOpenProfile ? (
            <button
              className="post-card__author-line post-card__profile-link"
              type="button"
              onClick={() => onOpenProfile(post.handle)}
              aria-label={`${post.authorName} ${post.handle}のプロフィールを開く`}
            >
              <span className="post-card__author">{post.authorName}</span>
              <span className="post-card__handle">{post.handle}</span>
            </button>
          ) : (
            <div className="post-card__author-line">
              <span className="post-card__author">{post.authorName}</span>
              <span className="post-card__handle">{post.handle}</span>
            </div>
          )}
          <p className="post-card__probability">
            <span>確率</span> {post.probability}
          </p>
        </div>
        <span className="post-card__kind">{kindLabel}</span>
      </div>

      <p className="post-card__body">{post.body}</p>

      {post.image && (
        <div className="post-card__media">
          {post.image.src ? (
            <img src={post.image.src} alt={post.image.alt} loading="lazy" />
          ) : (
            <div className="post-card__media-placeholder" role="img" aria-label={post.image.alt}>
              画像
            </div>
          )}
        </div>
      )}

      <footer className="post-card__footer">
        <time className="post-card__date" dateTime={post.timestamp}>
          {post.dateLabel}
        </time>
        <div className="post-card__actions">
          <button
            className={`post-action${liked ? " is-liked" : ""}`}
            type="button"
            aria-label={`${liked ? "いいねを解除" : "いいね"} (${formatLikes(likeCount)})`}
            aria-pressed={liked}
            onClick={toggleLike}
          >
            <span className="post-action__icon post-action__icon--like" aria-hidden="true" />
            <span>{formatLikes(likeCount)}</span>
          </button>
          <button
            className="post-action post-action--share"
            type="button"
            aria-label="投稿を共有"
            onClick={sharePost}
          >
            <span className="post-action__icon post-action__icon--share" aria-hidden="true" />
          </button>
        </div>
      </footer>
    </article>
  );
}
