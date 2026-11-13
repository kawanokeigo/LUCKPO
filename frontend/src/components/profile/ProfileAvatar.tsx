type ProfileAvatarProps = {
  onClick?: () => void;
  avatarUrl?: string | null;
};

export default function ProfileAvatar({ onClick, avatarUrl }: ProfileAvatarProps) {
  const content = <span className={`profile-avatar__image${avatarUrl ? " has-avatar" : ""}`} style={avatarUrl ? { backgroundImage: `url("${avatarUrl}")` } : undefined} aria-hidden="true" />;

  if (onClick) {
    return (
      <button className="profile-avatar" type="button" onClick={onClick} aria-label="マイページ">
        {content}
      </button>
    );
  }

  return <div className="profile-avatar" role="img" aria-label="プロフィール画像">{content}</div>;
}
