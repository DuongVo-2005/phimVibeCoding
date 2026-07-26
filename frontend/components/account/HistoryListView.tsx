'use client';

import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Pagination } from '@/components/ui/Pagination';
import { ContinueWatchingCard } from '@/components/film/ContinueWatchingCard';
import { toProgressPercent } from '@/components/film/ContinueWatchingSection';
import type { PaginationQueryParams } from '@/lib/api/types';
import { useRemoveHistoryMutation } from '@/lib/query/mutations';
import { historiesQueryOptions } from '@/lib/query/options';
import type { History } from '@/lib/types/history';
import { formatTimeAgo } from '@/lib/utils/format-time-ago';
import { buildWatchUrl } from '@/lib/watch/url';
import { useNotification } from '@/hooks/useNotification';

const PAGE_LIMIT = 8;

/**
 * HistoryListView — nội dung trang `/user/lich-su` (Phase 17B.2). Tái dùng 100% hạ tầng đã có,
 * KHÔNG tạo API layer/hook mới ngoài `useRemoveHistoryMutation` (mutation đầu tiên cho domain
 * `histories`, xem `lib/query/mutations.ts`): `historiesApi`/`historiesQueryOptions` (đọc),
 * `ContinueWatchingCard` (card, dùng chung với khối "Tiếp tục xem"), `toProgressPercent` (export từ
 * `ContinueWatchingSection`, không tính lại), `buildWatchUrl` (điều hướng resume), `formatTimeAgo`
 * (thời gian xem gần nhất — field server thật `lastWatchedAt`).
 *
 * "Tập đã xem": theo đúng quy ước đã dùng ở `ContinueWatchingSection.toSubtitle` —
 * `history.film.episodeCurrent` (field denormalized trên phim, KHÔNG phải field riêng của
 * `History` — backend không trả tên tập user thực sự đã xem, chỉ có `episodeSlug`). Không bịa dữ
 * liệu khác.
 *
 * Nút xoá: overlay sibling (không lồng trong `Link` của `ContinueWatchingCard`), cùng pattern
 * `FavoriteListView.tsx` — `preventDefault`+`stopPropagation` chặn điều hướng khi bấm xoá, luôn
 * hiển thị (không ẩn theo hover) để hỗ trợ chạm/bàn phím.
 *
 * Tự điều chỉnh trang: xoá mục cuối cùng của trang hiện tại (khi đó không phải trang 1) làm
 * `totalPages` giảm xuống dưới `page` đang xem — nếu không xử lý, người dùng sẽ kẹt ở EmptyState dù
 * các trang trước vẫn còn mục, và `Pagination` cũng biến mất (do `totalPages` không còn > 1) nên
 * không có cách quay lại. `totalPages > 0` loại trừ trường hợp xoá hết sạch lịch sử (totalItems=0 →
 * `totalPages=0`, EmptyState lúc này là đúng, không lùi trang).
 */
export function HistoryListView() {
  const { data: session } = useSession();
  const accessToken = session?.accessToken;
  const notify = useNotification();
  const mutation = useRemoveHistoryMutation();
  const [page, setPage] = useState(1);
  // Theo dõi `meta.page` đã xử lý lần gần nhất — pattern "Adjusting state when a prop changes"
  // (React docs) để lùi trang NGAY trong lúc render (không dùng `useEffect`, tránh cascading render
  // không cần thiết) khi kết quả trả về cho thấy trang đang xem đã vượt quá `totalPages` mới.
  const [adjustedForPage, setAdjustedForPage] = useState<number | undefined>(undefined);

  const listParams: PaginationQueryParams = { page, limit: PAGE_LIMIT };
  const { data, isLoading, isError, refetch } = useQuery(
    historiesQueryOptions.recent(listParams, accessToken),
  );

  if (
    data &&
    data.meta.page !== adjustedForPage &&
    data.meta.totalPages > 0 &&
    data.meta.page > data.meta.totalPages
  ) {
    setAdjustedForPage(data.meta.page);
    setPage(data.meta.totalPages);
  }

  const handleRemove = (history: History) => {
    if (mutation.isPending || !accessToken) {
      return;
    }

    mutation.mutate(
      { filmId: history.film._id, listParams },
      {
        onSuccess: () => notify.success(`Đã xoá "${history.film.title}" khỏi lịch sử xem.`),
        onError: () => notify.error('Không thể xoá lịch sử xem, vui lòng thử lại.'),
      },
    );
  };

  if (isError) {
    return <ErrorState message="Không tải được lịch sử xem." onRetry={() => refetch()} />;
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md">
        {Array.from({ length: PAGE_LIMIT }).map((_, index) => (
          <div
            key={index}
            className="bg-surface-container/60 p-base rounded-[20px]"
            aria-hidden="true"
          >
            <div className="aspect-video rounded-xl overflow-hidden mb-base bg-surface-container" />
            <div className="px-2">
              <h3 className="font-bold text-body-lg rounded bg-surface-container text-transparent w-3/4">
                &nbsp;
              </h3>
              <p className="text-label-md rounded bg-surface-container text-transparent w-1/2 mt-1">
                &nbsp;
              </p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const items = data?.items ?? [];

  if (items.length === 0) {
    return (
      <EmptyState
        icon="history"
        message="Chưa có lịch sử xem."
        subtitle="Phim bạn xem sẽ xuất hiện ở đây để tiếp tục xem sau."
      />
    );
  }

  return (
    <div className="flex flex-col gap-lg">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md">
        {items.map((history) => (
          <div key={history._id} className="relative">
            <ContinueWatchingCard
              title={history.film.title}
              subtitle={
                history.film.episodeCurrent
                  ? `${history.film.episodeCurrent} • ${formatTimeAgo(history.lastWatchedAt)}`
                  : formatTimeAgo(history.lastWatchedAt)
              }
              imageSrc={history.film.posterUrl ?? history.film.thumbUrl ?? ''}
              progressPercent={toProgressPercent(history)}
              href={buildWatchUrl(history.film.slug)}
            />
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                handleRemove(history);
              }}
              disabled={mutation.isPending}
              aria-label={`Xoá "${history.film.title}" khỏi lịch sử xem`}
              className="absolute top-md left-md z-30 w-8 h-8 rounded-full bg-black/70 backdrop-blur flex items-center justify-center text-white shadow-lg transition-transform duration-300 ease-out hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                close
              </span>
            </button>
          </div>
        ))}
      </div>

      {data && data.meta.totalPages > 1 ? (
        <Pagination
          currentPage={data.meta.page}
          pages={[data.meta.page]}
          lastPage={data.meta.totalPages}
          onPageChange={setPage}
        />
      ) : null}
    </div>
  );
}
