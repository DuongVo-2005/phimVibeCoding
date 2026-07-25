import { request } from './client';
import { PLAYLISTS_ENDPOINTS } from './endpoints';

/**
 * Khớp `playlists.controller.ts` (Phase 9.2 audit). Toàn bộ route thuộc module này đều yêu cầu
 * access token (`@ApiBearerAuth()` ở cấp controller). `GET /playlists` KHÔNG phân trang (controller
 * không có `@Query()`, service trả mảng đầy đủ) — khác với films/actors/comments/favorites, không
 * suy đoán thêm tham số nào ngoài xác nhận từ source. Chưa gọi thật ở đâu.
 */
export const playlistsApi = {
  create(body: unknown, accessToken: string) {
    return request<unknown>(PLAYLISTS_ENDPOINTS.create, { method: 'POST', body, accessToken });
  },

  mine(accessToken: string) {
    return request<unknown[]>(PLAYLISTS_ENDPOINTS.mine, { accessToken });
  },

  byId(id: string, accessToken: string) {
    return request<unknown>(PLAYLISTS_ENDPOINTS.byId(id), { accessToken });
  },

  update(id: string, body: unknown, accessToken: string) {
    return request<unknown>(PLAYLISTS_ENDPOINTS.byId(id), {
      method: 'PATCH',
      body,
      accessToken,
    });
  },

  remove(id: string, accessToken: string) {
    return request<null>(PLAYLISTS_ENDPOINTS.byId(id), { method: 'DELETE', accessToken });
  },

  addFilm(id: string, body: unknown, accessToken: string) {
    return request<unknown>(PLAYLISTS_ENDPOINTS.addFilm(id), {
      method: 'POST',
      body,
      accessToken,
    });
  },

  removeFilm(id: string, filmId: string, accessToken: string) {
    return request<unknown>(PLAYLISTS_ENDPOINTS.removeFilm(id, filmId), {
      method: 'DELETE',
      accessToken,
    });
  },
};
