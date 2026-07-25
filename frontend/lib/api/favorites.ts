import type { PaginatedResponse } from '@/lib/types/common';
import type { CreateFavoriteInput, Favorite, FavoriteTargetType } from '@/lib/types/favorite';
import { request } from './client';
import { FAVORITES_ENDPOINTS } from './endpoints';
import type { PaginationQueryParams } from './types';

/**
 * Khớp `favorites.controller.ts` + `QueryFavoriteDto` thật (Phase 11.0/11.2 audit). Toàn bộ route
 * thuộc module này đều yêu cầu access token (`@ApiBearerAuth()` ở cấp controller, không có route
 * Public nào).
 */
export type FavoritesQueryParams = PaginationQueryParams & {
  /** Bắt buộc — QueryFavoriteDto.targetType không có @IsOptional(). */
  targetType: FavoriteTargetType;
};

export const favoritesApi = {
  add(body: CreateFavoriteInput, accessToken: string) {
    return request<Favorite>(FAVORITES_ENDPOINTS.add, { method: 'POST', body, accessToken });
  },

  remove(targetType: string, targetId: string, accessToken: string) {
    return request<null>(FAVORITES_ENDPOINTS.remove(targetType, targetId), {
      method: 'DELETE',
      accessToken,
    });
  },

  mine(query: FavoritesQueryParams, accessToken: string) {
    return request<PaginatedResponse<Favorite>>(FAVORITES_ENDPOINTS.mine, { query, accessToken });
  },
};
