type ProfileAvatarProps = {
  onClick?: () => void;
};

export default function ProfileAvatar({ onClick }: ProfileAvatarProps) {
  const content = <span className="profile-avatar__image" aria-hidden="true" />;

  if (onClick) {
    return (
      <button className="profile-avatar" type="button" onClick={onClick} aria-label="マイページ">
        {content}
      </button>
    );
  }

  return <div className="profile-avatar" role="img" aria-label="プロフィール画像">{content}</div>;
}
