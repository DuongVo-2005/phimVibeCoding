import { request } from './client';
import { FAVORITES_ENDPOINTS } from './endpoints';
import type { PaginatedResult, PaginationQueryParams } from './types';

/**
 * Khớp `favorites.controller.ts` + `QueryFavoriteDto` (Phase 9.2 audit). Toàn bộ route thuộc
 * module này đều yêu cầu access token (`@ApiBearerAuth()` ở cấp controller, không có route
 * Public nào). Chưa gọi thật ở đâu.
 */
export type FavoritesQueryParams = PaginationQueryParams & {
  /** Bắt buộc — QueryFavoriteDto.targetType không có @IsOptional(). */
  targetType: 'film' | 'actor';
};

export const favoritesApi = {
  add(body: unknown, accessToken: string) {
    return request<unknown>(FAVORITES_ENDPOINTS.add, { method: 'POST', body, accessToken });
  },

  remove(targetType: string, targetId: string, accessToken: string) {
    return request<null>(FAVORITES_ENDPOINTS.remove(targetType, targetId), {
      method: 'DELETE',
      accessToken,
    });
  },

  mine(query: FavoritesQueryParams, accessToken: string) {
    return request<PaginatedResult<unknown>>(FAVORITES_ENDPOINTS.mine, { query, accessToken });
  },
};
