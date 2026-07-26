'use client';

import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useNotification } from '@/hooks/useNotification';
import { useRatingMutation } from '@/lib/query/mutations';
import { ratingsQueryOptions } from '@/lib/query/options';

const LOGIN_REQUIRED_MESSAGE = 'Bạn cần đăng nhập để sử dụng tính năng này.';

/**
 * useRating — Phase 14B: hook dùng CHUNG cho Movie Detail (`FilmHero`) + Watch Page — tránh lặp
 * logic đọc `GET /ratings/film/:filmId` (summary, Public) + `GET /ratings/film/:filmId/me` (điểm
 * của user, cần đăng nhập) + gọi mutation ở 2 nơi.
 *
 * `average`/`count` là `null` khi CHƯA có dữ liệu (đang tải) — khác `0` (đã tải, trung bình thật
 * là 0) — để nơi gọi tự quyết định hiển thị placeholder khi đang tải, giữ đúng hành vi hiển thị đã
 * có từ Phase 11.6A/12A (không đổi UI hiện tại).
 *
 * Phase 15A: chưa đăng nhập → `notify.info()` (thay no-op im lặng). Chặn double-click bằng
 * `mutation.isPending`. Thành công/lỗi → `notify.success()`/`notify.error()` qua callback thứ 2
 * của `mutate()` (không sửa `useRatingMutation`).
 */
export function useRating(filmId: string) {
  const { data: session } = useSession();
  const accessToken = session?.accessToken;
  const notify = useNotification();

  const { data: summary } = useQuery({
    ...ratingsQueryOptions.summary(filmId),
    enabled: Boolean(filmId),
  });
  const { data: myRatingData } = useQuery({
    ...ratingsQueryOptions.mine(filmId, accessToken),
    enabled: Boolean(accessToken) && Boolean(filmId),
  });

  const mutation = useRatingMutation();

  const setRating = (score: number) => {
    if (mutation.isPending) {
      return;
    }
    if (!accessToken) {
      notify.info(LOGIN_REQUIRED_MESSAGE);
      return;
    }
    if (!filmId) {
      return;
    }

    mutation.mutate(
      { filmId, score },
      {
        onSuccess: () => notify.success('Đã lưu đánh giá của bạn.'),
        onError: () => notify.error('Không thể lưu đánh giá, vui lòng thử lại.'),
      },
    );
  };

  return {
    average: summary?.average ?? null,
    count: summary?.count ?? null,
    myRating: myRatingData?.score ?? null,
    setRating,
    isPending: mutation.isPending,
  };
}
