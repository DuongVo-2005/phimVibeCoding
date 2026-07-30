import { formatTimeAgo } from '@/lib/utils/format-time-ago';
import type { Notification, NotificationType } from '@/lib/types/notification';

const TYPE_ICON: Record<NotificationType, string> = {
  system: 'info',
  comment: 'chat_bubble',
  favorite: 'favorite',
  account: 'person',
};

/**
 * NotificationItem — dùng chung cho `NotificationBell` (dropdown, gọn) và
 * `NotificationListView` (trang đầy đủ) — cùng 1 model dữ liệu (`Notification`), chỉ khác
 * `compact` (dropdown ẩn nút "Xoá", bấm cả dòng để đánh dấu đã đọc thay vì có nút riêng, khớp
 * UX rút gọn của dropdown).
 *
 * Chưa đọc: chấm tròn `bg-primary` + nền `bg-primary/5` nhẹ. Đã đọc: không chấm, không nền —
 * phân biệt bằng thị giác, không chỉ bằng chữ, khớp yêu cầu "Read / unread state".
 */
export function NotificationItem({
  notification,
  compact = false,
  onMarkRead,
  onDelete,
}: {
  notification: Notification;
  compact?: boolean;
  onMarkRead?: (id: string) => void;
  onDelete?: (id: string) => void;
}) {
  const handleClick = () => {
    if (!notification.isRead) {
      onMarkRead?.(notification._id);
    }
  };

  return (
    <div
      role={compact ? 'button' : undefined}
      tabIndex={compact ? 0 : undefined}
      onClick={compact ? handleClick : undefined}
      onKeyDown={
        compact
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') handleClick();
            }
          : undefined
      }
      className={`flex items-start gap-sm p-sm rounded-lg transition-colors duration-200 ${
        notification.isRead ? '' : 'bg-primary/5'
      } ${compact ? 'cursor-pointer hover:bg-white/5' : ''}`}
    >
      <span
        className="material-symbols-outlined text-primary text-[20px] shrink-0 mt-0.5"
        aria-hidden="true"
      >
        {TYPE_ICON[notification.type]}
      </span>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-xs">
          {!notification.isRead ? (
            <span
              className="h-2 w-2 rounded-full bg-primary shrink-0"
              aria-label="Chưa đọc"
              title="Chưa đọc"
            />
          ) : null}
          <p className="text-label-md font-bold text-on-surface truncate">{notification.title}</p>
        </div>
        <p className="text-label-md text-on-surface-variant line-clamp-2">{notification.message}</p>
        <p className="text-label-md text-on-surface-variant/70 mt-0.5">
          {formatTimeAgo(notification.createdAt)}
        </p>
      </div>

      {!compact ? (
        <div className="flex items-center gap-sm shrink-0">
          {!notification.isRead ? (
            <button
              type="button"
              onClick={() => onMarkRead?.(notification._id)}
              className="text-primary hover:underline text-label-md font-bold"
            >
              Đánh dấu đã đọc
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => onDelete?.(notification._id)}
            className="text-error hover:underline text-label-md font-bold"
          >
            Xoá
          </button>
        </div>
      ) : null}
    </div>
  );
}
