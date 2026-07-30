/**
 * Khớp `notifications/schemas/notification.schema.ts` thật (Phase 34) — `userId,type,title,
 * message,metadata,isRead,createdAt`. `type` giới hạn đúng 4 giá trị tối thiểu theo yêu cầu phase
 * (`NotificationType` enum ở backend `common/constants`).
 */
export type NotificationType = 'system' | 'comment' | 'favorite' | 'account';

export interface Notification {
  _id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata: Record<string, unknown> | null;
  isRead: boolean;
  createdAt: string;
}

/** Khớp `NotificationListResult` thật (`notifications.service.ts`) — MỞ RỘNG
 * `PaginatedResponse<Notification>` bằng `unreadCount` (tổng số chưa đọc của user, không bị giới
 * hạn bởi trang/`isRead` filter đang áp dụng cho `items`) — dùng trực tiếp cho badge chuông thông
 * báo mà không cần endpoint `/notifications/unread-count` riêng. */
export interface NotificationListResponse {
  items: Notification[];
  meta: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
  unreadCount: number;
}
