import PostCard from "./PostCard";
import type { TimelinePost } from "../types";

type TimelineFeedProps = {
  posts: TimelinePost[];
};

export default function TimelineFeed({ posts }: TimelineFeedProps) {
  return (
    <section className="timeline-feed" aria-label="投稿一覧">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </section>
  );
}
