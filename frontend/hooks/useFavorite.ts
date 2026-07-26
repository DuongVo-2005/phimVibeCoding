'use client';

import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import type { FavoritesQueryParams } from '@/lib/api/favorites';
import { useNotification } from '@/hooks/useNotification';
import { favoritesQueryOptions } from '@/lib/query/options';
import { useFavoriteMutation } from '@/lib/query/mutations';
import type { FavoriteTargetType } from '@/lib/types/favorite';

const LIST_LIMIT = 100;
const LOGIN_REQUIRED_MESSAGE = 'Bạn cần đăng nhập để sử dụng tính năng này.';

/**
 * useFavorite — Phase 14A: hook dùng CHUNG cho Movie Detail (`FilmHero`) + Watch Page (2 nút) —
 * tránh lặp lại logic đọc `GET /favorites` + suy ra `isFavorited` + gọi mutation ở 2 nơi.
 *
 * Xác định `isFavorited`: gọi `favoritesApi.mine({targetType, limit:100})` (đã có sẵn từ Phase
 * 11.2/11.3A, KHÔNG thêm endpoint) rồi tự dò `target._id === targetId` trong danh sách trả về —
 * backend không có endpoint check-status riêng (đã xác nhận ở audit Phase 11.6C). `limit: 100`
 * (tối đa `MAX_PAGE_LIMIT` backend cho phép) để giảm rủi ro phim đang xem nằm ngoài trang đầu.
 *
 * Phase 15A: chưa đăng nhập → `notify.info()` (thay vì no-op im lặng như trước). Chặn double-click
 * bằng `mutation.isPending` (kiểm tra TRƯỚC mọi thứ khác — request đang bay thì bỏ qua ngay, không
 * cần thông báo gì thêm). Thành công/lỗi → `notify.success()`/`notify.error()` qua callback thứ 2
 * của `mutate()` (không sửa `useFavoriteMutation` trong `lib/query/mutations.ts` — tách đúng vai
 * trò: cache/rollback ở mutation hook, UX/thông báo ở hook này).
 */
export function useFavorite(targetType: FavoriteTargetType, targetId: string) {
  const { data: session } = useSession();
  const accessToken = session?.accessToken;
  const notify = useNotification();
  const listParams: FavoritesQueryParams = { targetType, limit: LIST_LIMIT };

  const { data } = useQuery(favoritesQueryOptions.mine(listParams, accessToken));
  const isFavorited = data?.items.some((favorite) => favorite.target?._id === targetId) ?? false;

  const mutation = useFavoriteMutation();

  const toggle = () => {
    if (mutation.isPending) {
      return;
    }
    if (!accessToken) {
      notify.info(LOGIN_REQUIRED_MESSAGE);
      return;
    }
    if (!targetId) {
      return;
    }

    mutation.mutate(
      { targetType, targetId, isFavorited, listParams },
      {
        onSuccess: () => {
          notify.success(
            isFavorited ? 'Đã bỏ khỏi danh sách yêu thích.' : 'Đã thêm vào danh sách yêu thích.',
          );
        },
        onError: () => {
          notify.error('Không thể cập nhật yêu thích, vui lòng thử lại.');
        },
      },
    );
  };

  return { isFavorited, toggle, isPending: mutation.isPending };
}
