'use client';

import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import type { FavoritesQueryParams } from '@/lib/api/favorites';
import { favoritesQueryOptions } from '@/lib/query/options';
import { useFavoriteMutation } from '@/lib/query/mutations';
import type { FavoriteTargetType } from '@/lib/types/favorite';

const LIST_LIMIT = 100;

/**
 * useFavorite — Phase 14A: hook dùng CHUNG cho Movie Detail (`FilmHero`) + Watch Page (2 nút) —
 * tránh lặp lại logic đọc `GET /favorites` + suy ra `isFavorited` + gọi mutation ở 2 nơi.
 *
 * Xác định `isFavorited`: gọi `favoritesApi.mine({targetType, limit:100})` (đã có sẵn từ Phase
 * 11.2/11.3A, KHÔNG thêm endpoint) rồi tự dò `target._id === targetId` trong danh sách trả về —
 * backend không có endpoint check-status riêng (đã xác nhận ở audit Phase 11.6C). `limit: 100`
 * (tối đa `MAX_PAGE_LIMIT` backend cho phép) để giảm rủi ro phim đang xem nằm ngoài trang đầu.
 *
 * Không gọi mutation khi chưa đăng nhập hoặc `targetId` rỗng (film chưa load xong) — no-op an
 * toàn, không throw.
 */
export function useFavorite(targetType: FavoriteTargetType, targetId: string) {
  const { data: session } = useSession();
  const accessToken = session?.accessToken;
  const listParams: FavoritesQueryParams = { targetType, limit: LIST_LIMIT };

  const { data } = useQuery(favoritesQueryOptions.mine(listParams, accessToken));
  const isFavorited = data?.items.some((favorite) => favorite.target?._id === targetId) ?? false;

  const mutation = useFavoriteMutation();

  const toggle = () => {
    if (!accessToken || !targetId) {
      return;
    }
    mutation.mutate({ targetType, targetId, isFavorited, listParams });
  };

  return { isFavorited, toggle, isPending: mutation.isPending };
}
