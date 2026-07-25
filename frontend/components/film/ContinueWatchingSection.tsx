'use client';

import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { Section } from '@/components/ui/Section';
import type { History } from '@/lib/types/history';
import { historiesQueryOptions } from '@/lib/query/options';
import { ContinueWatchingCard } from './ContinueWatchingCard';

/**
 * Phase 11.4A: wiring `GET /histories/recent` cho khối "Tiếp tục xem" — thay
 * `_mock/homepage-data.ts`'s `continueWatching`. `ContinueWatchingCard` (presentational) không đổi.
 *
 * `progressPercent`/`subtitle` không phải field server (xem ghi chú `lib/types/history.ts`) — tự
 * tính ở đây từ `progressSeconds`/`totalDurationSeconds`/`film.episodeCurrent`.
 */
function toProgressPercent(history: History): number {
  if (!history.totalDurationSeconds) return 0;
  return Math.min(100, Math.round((history.progressSeconds / history.totalDurationSeconds) * 100));
}

function toSubtitle(history: History): string {
  const remainingSeconds = Math.max(history.totalDurationSeconds - history.progressSeconds, 0);
  const remainingLabel = `Còn ${Math.round(remainingSeconds / 60)} phút`;
  return history.film.episodeCurrent
    ? `${history.film.episodeCurrent} • ${remainingLabel}`
    : remainingLabel;
}

export function ContinueWatchingSection() {
  const { data: session, status: sessionStatus } = useSession();
  const accessToken = session?.accessToken;
  const { data, isLoading } = useQuery(historiesQueryOptions.recent(undefined, accessToken));

  // Chưa đăng nhập: route yêu cầu accessToken (không có route Public tương đương) — ẩn hẳn khối,
  // không có thiết kế "khách chưa đăng nhập" nào cho section này ở design/homepage.html.
  if (sessionStatus === 'unauthenticated') {
    return null;
  }

  // Loading: session đang resolve hoặc query đang fetch lần đầu — placeholder tĩnh, KHÔNG dùng
  // class animation (đúng yêu cầu "không thêm animation"). Review Phase 11.4A (phát hiện A): dựng
  // lại ĐÚNG cấu trúc `ContinueWatchingCard` (padding `p-base`, margin `mb-base`, khối text 2 dòng)
  // thay vì chỉ box `aspect-video` — để chiều cao skeleton khớp chiều cao card thật, loại bỏ CLS.
  // Dòng text dùng lại chính xác class `text-body-lg`/`text-label-md` của card thật (chỉ đổi màu
  // chữ thành trong suốt + nền màu) nên line-height đảm bảo khớp tuyệt đối, không cần đoán px.
  if (sessionStatus === 'loading' || isLoading) {
    return (
      <Section title="Tiếp tục xem">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md">
          {Array.from({ length: 4 }).map((_, index) => (
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
      </Section>
    );
  }

  const items = data?.items ?? [];

  // Empty: đã đăng nhập nhưng chưa có lịch sử xem — ẩn khối, không có thiết kế "empty state" riêng
  // cho section này.
  if (items.length === 0) {
    return null;
  }

  return (
    <Section title="Tiếp tục xem">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md">
        {items.map((history) => (
          <ContinueWatchingCard
            key={history._id}
            title={history.film.title}
            subtitle={toSubtitle(history)}
            imageSrc={history.film.posterUrl ?? history.film.thumbUrl ?? ''}
            progressPercent={toProgressPercent(history)}
          />
        ))}
      </div>
    </Section>
  );
}
