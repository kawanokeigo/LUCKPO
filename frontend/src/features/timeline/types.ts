export type PostKind = "luck" | "unluck";

export type TimelinePost = {
  id: string;
  kind: PostKind;
  authorName: string;
  handle: string;
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
