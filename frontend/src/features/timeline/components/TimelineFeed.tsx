import PostCard from "./PostCard";
import type { TimelinePost } from "../types";

type TimelineFeedProps = {
  posts: TimelinePost[];
  onOpenProfile?: (handle: string) => void;
};

export default function TimelineFeed({ posts, onOpenProfile }: TimelineFeedProps) {
  return (
    <section className="timeline-feed" aria-label="投稿一覧">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} onOpenProfile={onOpenProfile} />
      ))}
    </section>
  );
}
