'use client';

import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Pagination } from '@/components/ui/Pagination';
import { SkeletonBlock } from '@/components/ui/SkeletonBlock';
import { NotificationItem } from '@/components/notifications/NotificationItem';
import { useNotification } from '@/hooks/useNotification';
import { ApiRequestError } from '@/lib/api/client';
import type { PaginationQueryParams } from '@/lib/api/types';
import {
  useDeleteNotificationMutation,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
} from '@/lib/query/mutations';
import { notificationsQueryOptions } from '@/lib/query/options';

const PAGE_LIMIT = 10;

/**
 * NotificationListView — nội dung trang `/user/thong-bao` (Phase 34). Cùng kiến trúc
 * `HistoryListView.tsx` — "tự lùi trang" khi xoá mục cuối cùng của trang hiện tại làm
 * `totalPages` giảm xuống dưới `page` đang xem (áp dụng NGAY trong lúc render, không dùng
 * `useEffect` — "Adjusting state when a prop changes", tránh cascading render thừa).
 */
export function NotificationListView() {
  const { data: session } = useSession();
  const accessToken = session?.accessToken;
  const notify = useNotification();
  const [page, setPage] = useState(1);
  const [adjustedForPage, setAdjustedForPage] = useState<number | undefined>(undefined);

  const listParams: PaginationQueryParams = { page, limit: PAGE_LIMIT };
  const { data, isLoading, isError, refetch } = useQuery(
    notificationsQueryOptions.list(listParams, accessToken),
  );

  const markReadMutation = useMarkNotificationReadMutation();
  const markAllReadMutation = useMarkAllNotificationsReadMutation();
  const deleteMutation = useDeleteNotificationMutation();

  if (
    data &&
    data.meta.page !== adjustedForPage &&
    data.meta.totalPages > 0 &&
    data.meta.page > data.meta.totalPages
  ) {
    setAdjustedForPage(data.meta.page);
    setPage(data.meta.totalPages);
  }

  const handleMarkRead = (id: string) => {
    markReadMutation.mutate(
      { id },
      {
        onError: (error) =>
          notify.error(
            error instanceof ApiRequestError ? error.message : 'Đánh dấu đã đọc thất bại.',
          ),
      },
    );
  };

  const handleMarkAllRead = () => {
    markAllReadMutation.mutate(undefined, {
      onSuccess: (result) => notify.success(`Đã đánh dấu ${result.updated} thông báo đã đọc.`),
      onError: (error) =>
        notify.error(
          error instanceof ApiRequestError ? error.message : 'Đánh dấu đã đọc thất bại.',
        ),
    });
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(
      { id },
      {
        onSuccess: () => notify.success('Đã xoá thông báo.'),
        onError: (error) =>
          notify.error(error instanceof ApiRequestError ? error.message : 'Xoá thất bại.'),
      },
    );
  };

  return (
    <div className="flex flex-col gap-lg">
      <div className="flex items-center justify-between gap-md">
        <div>
          <h1 className="text-headline-lg font-headline-lg text-on-surface">Thông báo</h1>
          <p className="text-body-md text-on-surface-variant">
            {data ? `${data.meta.totalItems.toLocaleString('vi-VN')} thông báo` : 'Đang tải...'}
          </p>
        </div>
        {data && data.unreadCount > 0 ? (
          <Button
            type="button"
            variant="secondary"
            onClick={handleMarkAllRead}
            disabled={markAllReadMutation.isPending}
          >
            {markAllReadMutation.isPending ? 'Đang xử lý...' : 'Đánh dấu tất cả đã đọc'}
          </Button>
        ) : null}
      </div>

      {isError ? (
        <ErrorState message="Không tải được thông báo." onRetry={() => refetch()} />
      ) : isLoading ? (
        <div className="flex flex-col gap-sm" aria-hidden="true">
          {Array.from({ length: PAGE_LIMIT }).map((_, index) => (
            <SkeletonBlock key={index} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : !data || data.items.length === 0 ? (
        <EmptyState icon="notifications_off" message="Chưa có thông báo nào." />
      ) : (
        <div className="flex flex-col gap-sm">
          <div className="flex flex-col gap-1 bg-surface-container rounded-2xl p-sm">
            {data.items.map((notification) => (
              <NotificationItem
                key={notification._id}
                notification={notification}
                onMarkRead={handleMarkRead}
                onDelete={handleDelete}
              />
            ))}
          </div>

          {data.meta.totalPages > 1 ? (
            <Pagination
              currentPage={data.meta.page}
              pages={[data.meta.page]}
              lastPage={data.meta.totalPages}
              onPageChange={setPage}
            />
          ) : null}
        </div>
      )}
    </div>
  );
}
