'use client';

import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { SkeletonBlock } from '@/components/ui/SkeletonBlock';
import { useNotification } from '@/hooks/useNotification';
import { ApiRequestError } from '@/lib/api/client';
import {
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
} from '@/lib/query/mutations';
import { notificationsQueryOptions } from '@/lib/query/options';
import { NotificationItem } from '@/components/notifications/NotificationItem';

const LOGIN_REQUIRED_MESSAGE = 'Bạn cần đăng nhập để sử dụng chức năng này.';
const DROPDOWN_PREVIEW_LIMIT = 5;

/**
 * NotificationBell — Phase 34 (Notification Center). Thay nút chuông tĩnh cũ trong `Header.tsx`
 * (trước đây: chưa đăng nhập → toast, đã đăng nhập → KHÔNG làm gì, "KHÔNG làm Notification Center
 * — ngoài phạm vi" theo ghi chú Phase 16A). Giữ NGUYÊN hành vi chưa-đăng-nhập (toast
 * `LOGIN_REQUIRED_MESSAGE`) — chỉ thêm nhánh đã-đăng-nhập.
 *
 * Dropdown chỉ lấy `limit=5` mới nhất (xem trước, giống mọi ứng dụng có notification center) —
 * danh sách đầy đủ + phân trang ở trang riêng `/user/thong-bao` (`NotificationListView`).
 *
 * Click-outside tự viết (chưa có component dropdown dùng chung nào trong dự án, xem audit trước
 * khi code) — `useRef` trên khối bao ngoài (nút + panel), so `event.target` bằng `.contains()`
 * trên `mousedown` (không phải `click` — đóng dropdown TRƯỚC khi sự kiện click lọt vào phần tử bên
 * dưới nếu có, tránh double-trigger).
 */
export function NotificationBell() {
  const { data: session } = useSession();
  const accessToken = session?.accessToken;
  const notify = useNotification();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, isError, refetch } = useQuery(
    notificationsQueryOptions.list({ limit: DROPDOWN_PREVIEW_LIMIT }, accessToken),
  );
  const markReadMutation = useMarkNotificationReadMutation();
  const markAllReadMutation = useMarkAllNotificationsReadMutation();

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleBellClick = () => {
    if (!session) {
      notify.info(LOGIN_REQUIRED_MESSAGE);
      return;
    }
    setIsOpen((prev) => !prev);
  };

  const handleMarkAllRead = () => {
    markAllReadMutation.mutate(undefined, {
      onError: (error) =>
        notify.error(
          error instanceof ApiRequestError ? error.message : 'Đánh dấu đã đọc thất bại.',
        ),
    });
  };

  const unreadCount = data?.unreadCount ?? 0;

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={handleBellClick}
        className="relative p-2 hover:bg-white/5 rounded-full transition-all scale-95 active:scale-90"
        aria-label="Thông báo"
        aria-expanded={isOpen}
      >
        <span className="material-symbols-outlined text-on-surface" aria-hidden="true">
          notifications
        </span>
        {unreadCount > 0 ? (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-error px-1 text-[10px] font-bold text-on-error">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <div className="absolute right-0 mt-sm w-80 max-h-[28rem] overflow-y-auto rounded-2xl bg-surface-container shadow-2xl border border-white/10 z-50 flex flex-col">
          <div className="flex items-center justify-between p-md border-b border-white/5 sticky top-0 bg-surface-container">
            <h2 className="text-label-lg font-label-lg text-on-surface">Thông báo</h2>
            {unreadCount > 0 ? (
              <button
                type="button"
                onClick={handleMarkAllRead}
                disabled={markAllReadMutation.isPending}
                className="text-primary hover:underline text-label-md font-bold disabled:opacity-50"
              >
                Đánh dấu tất cả đã đọc
              </button>
            ) : null}
          </div>

          <div className="flex flex-col gap-1 p-sm">
            {isError ? (
              <ErrorState message="Không tải được thông báo." onRetry={() => refetch()} />
            ) : isLoading ? (
              <div className="flex flex-col gap-sm p-sm" aria-hidden="true">
                {Array.from({ length: 3 }).map((_, index) => (
                  <SkeletonBlock key={index} className="h-14 rounded-lg" />
                ))}
              </div>
            ) : !data || data.items.length === 0 ? (
              <EmptyState icon="notifications_off" message="Chưa có thông báo nào." />
            ) : (
              data.items.map((notification) => (
                <NotificationItem
                  key={notification._id}
                  notification={notification}
                  compact
                  onMarkRead={(id) => markReadMutation.mutate({ id })}
                />
              ))
            )}
          </div>

          <Link
            href="/user/thong-bao"
            onClick={() => setIsOpen(false)}
            className="block text-center p-sm text-label-md text-primary hover:underline border-t border-white/5 sticky bottom-0 bg-surface-container"
          >
            Xem tất cả
          </Link>
        </div>
      ) : null}
    </div>
  );
}
