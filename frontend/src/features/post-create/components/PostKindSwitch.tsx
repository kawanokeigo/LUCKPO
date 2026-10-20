import type { PostKind } from "../../timeline/types";

type PostKindSwitchProps = {
  kind: PostKind;
  onChange: (kind: PostKind) => void;
};

export default function PostKindSwitch({ kind, onChange }: PostKindSwitchProps) {
  const isLuck = kind === "luck";

  return (
    <button
      className={`post-kind-switch${isLuck ? " is-luck" : " is-unluck"}`}
      type="button"
      role="switch"
      aria-checked={isLuck}
      aria-label="幸運・不幸の切り替え"
      onClick={() => onChange(isLuck ? "unluck" : "luck")}
    >
      <span>{isLuck ? "幸運" : "不幸"}</span>
      <span className="post-kind-switch__thumb" aria-hidden="true" />
    </button>
  );
}
