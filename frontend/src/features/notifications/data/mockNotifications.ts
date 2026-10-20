import type { NotificationItem } from "../types";

export const mockNotifications: NotificationItem[] = [
  {
    id: "notification-1",
    message: "あなたの投稿が10いいねされました。",
    postPreview: "元投稿の本文がここに入ります",
    timestamp: "2026-10-03T11:12:00+09:00",
    dateLabel: "2026/10/03 11:12",
  },
  {
    id: "notification-2",
    message: "あなたの投稿がいいねされました。",
    postPreview: "元投稿の本文がここに入ります",
    timestamp: "2026-10-03T11:11:00+09:00",
    dateLabel: "2026/10/03 11:11",
  },
  {
    id: "notification-3",
    message: "あなたの投稿がいいねされました。",
    postPreview: "元投稿の本文が長いと途中で…になることを忘れないでね",
    timestamp: "2026-10-03T11:11:00+09:00",
    dateLabel: "2026/10/03 11:11",
  },
  {
    id: "notification-4",
    message: "あなたの投稿がいいねされました。",
    postPreview: "元投稿の本文がここに入ります",
    timestamp: "2026-10-03T11:11:00+09:00",
    dateLabel: "2026/10/03 11:11",
  },
];
