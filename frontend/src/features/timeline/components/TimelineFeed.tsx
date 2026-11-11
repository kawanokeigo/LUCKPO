import PostCard from "./PostCard";
import type { TimelinePost } from "../types";

type TimelineFeedProps = {
  posts: TimelinePost[];
  onOpenProfile?: (handle: string) => void;
  onLikeChange?: (postId: string, liked: boolean) => Promise<void>;
};

export default function TimelineFeed({ posts, onOpenProfile, onLikeChange }: TimelineFeedProps) {
  return (
    <section className="timeline-feed" aria-label="投稿一覧">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} onOpenProfile={onOpenProfile} onLikeChange={onLikeChange} />
      ))}
    </section>
  );
}
