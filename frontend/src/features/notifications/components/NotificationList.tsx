import type { NotificationItem } from "../types";

type NotificationListProps = {
  notifications: NotificationItem[];
};

export default function NotificationList({ notifications }: NotificationListProps) {
  return (
    <section className="notification-list" aria-label="通知一覧">
      {notifications.map((notification) => (
        <article className="notification-item" key={notification.id}>
          <p className="notification-item__message">{notification.message}</p>
          <p className="notification-item__preview">{notification.postPreview}</p>
          <time className="notification-item__date" dateTime={notification.timestamp}>
            {notification.dateLabel}
          </time>
        </article>
      ))}
      <p className="notification-list__end">通知がこれ以上ありません。</p>
    </section>
  );
}
