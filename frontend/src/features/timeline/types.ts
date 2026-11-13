export type PostKind = "luck" | "unluck";

export type TimelinePost = {
  id: string;
  authorId?: string;
  kind: PostKind;
  authorName: string;
  handle: string;
  authorAvatarUrl?: string | null;
  probability: string;
  body: string;
  timestamp: string;
  dateLabel: string;
  likes: number;
  liked?: boolean;
  image?: {
    src?: string;
    alt: string;
  };
};
