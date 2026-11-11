import type { PostCreatePrefill } from "../post-create/types";

export type Fortune = {
  id: string;
  name: string;
  subtitle: string;
  message: string;
  kind: PostCreatePrefill["kind"];
  probability: string;
  weight: number;
};
