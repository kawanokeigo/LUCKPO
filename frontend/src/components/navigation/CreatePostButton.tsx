type CreatePostButtonProps = {
  onClick: () => void;
};

export default function CreatePostButton({ onClick }: CreatePostButtonProps) {
  return (
    <button className="create-post-button" type="button" aria-label="投稿を作成" onClick={onClick}>
      <span aria-hidden="true">+</span>
    </button>
  );
}
