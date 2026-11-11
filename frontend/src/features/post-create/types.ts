import type { PostKind } from "../timeline/types";

export type PostCreatePrefill = {
  kind: PostKind;
  probability: string;
  body: string;
};

export type PostDraft = PostCreatePrefill & {
  image?: File;
};
