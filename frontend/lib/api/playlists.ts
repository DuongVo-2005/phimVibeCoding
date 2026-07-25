import type {
  AddFilmToPlaylistInput,
  CreatePlaylistInput,
  PlaylistDetail,
  PlaylistSummary,
  UpdatePlaylistInput,
} from '@/lib/types/playlist';
import { request } from './client';
import { PLAYLISTS_ENDPOINTS } from './endpoints';

/**
 * Khớp `playlists.controller.ts` thật (Phase 11.0/11.2 audit). Toàn bộ route thuộc module này đều
 * yêu cầu access token (`@ApiBearerAuth()` ở cấp controller). `GET /playlists` KHÔNG phân trang
 * (controller không có `@Query()`, service trả mảng đầy đủ) — khác với films/actors/comments/
 * favorites; response là `PlaylistSummary[]` (KHÔNG có field `films` — xem ghi chú tách biệt
 * `PlaylistSummary`/`PlaylistDetail` trong `lib/types/playlist.ts`, quyết định 3 Phase 11.2).
 */
export const playlistsApi = {
  create(body: CreatePlaylistInput, accessToken: string) {
    return request<PlaylistSummary>(PLAYLISTS_ENDPOINTS.create, {
      method: 'POST',
      body,
      accessToken,
    });
  },

  mine(accessToken: string) {
    return request<PlaylistSummary[]>(PLAYLISTS_ENDPOINTS.mine, { accessToken });
  },

  byId(id: string, accessToken: string) {
    return request<PlaylistDetail>(PLAYLISTS_ENDPOINTS.byId(id), { accessToken });
  },

  update(id: string, body: UpdatePlaylistInput, accessToken: string) {
    return request<PlaylistSummary>(PLAYLISTS_ENDPOINTS.byId(id), {
      method: 'PATCH',
      body,
      accessToken,
    });
  },

  remove(id: string, accessToken: string) {
    return request<null>(PLAYLISTS_ENDPOINTS.byId(id), { method: 'DELETE', accessToken });
  },

  addFilm(id: string, body: AddFilmToPlaylistInput, accessToken: string) {
    return request<PlaylistDetail>(PLAYLISTS_ENDPOINTS.addFilm(id), {
      method: 'POST',
      body,
      accessToken,
    });
  },

  removeFilm(id: string, filmId: string, accessToken: string) {
    return request<PlaylistDetail>(PLAYLISTS_ENDPOINTS.removeFilm(id, filmId), {
      method: 'DELETE',
      accessToken,
    });
  },
};
