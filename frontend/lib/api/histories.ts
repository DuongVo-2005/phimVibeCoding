import type { PaginatedResponse } from '@/lib/types/common';
import type { History, UpdateHistoryInput } from '@/lib/types/history';
import { request } from './client';
import { HISTORIES_ENDPOINTS } from './endpoints';
import type { PaginationQueryParams } from './types';

/**
 * historiesApi — Phase 11.2 (mục A trong audit: thiếu hẳn trước phase này, cần cho Watch Movie/
 * User Dashboard). Khớp `histories.controller.ts` thật (Phase 11.0 audit). Toàn bộ route yêu cầu
 * access token. Chưa gọi thật ở đâu — chỉ skeleton sẵn sàng cho hook/page dùng ở phase sau.
 */
export const historiesApi = {
  update(body: UpdateHistoryInput, accessToken: string) {
    return request<History>(HISTORIES_ENDPOINTS.update, { method: 'POST', body, accessToken });
  },

  recent(query: PaginationQueryParams | undefined, accessToken: string) {
    return request<PaginatedResponse<History>>(HISTORIES_ENDPOINTS.recent, {
      query,
      accessToken,
    });
  },

  byFilm(filmId: string, accessToken: string) {
    return request<History | null>(HISTORIES_ENDPOINTS.byFilm(filmId), { accessToken });
  },

  remove(filmId: string, accessToken: string) {
    return request<null>(HISTORIES_ENDPOINTS.remove(filmId), { method: 'DELETE', accessToken });
  },
};
