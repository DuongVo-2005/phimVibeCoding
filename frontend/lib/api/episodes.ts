import type { CreateEpisodeInput, Episode, UpdateEpisodeInput } from '@/lib/types/episode';
import { request } from './client';
import { EPISODES_ENDPOINTS } from './endpoints';

/** Phase 35 (Episode Management API) — toàn bộ route yêu cầu admin + `films:update` (không có
 * route Public nào, khác `filmsApi` công khai). */
export const episodesApi = {
  listByFilm(filmId: string, accessToken: string) {
    return request<Episode[]>(EPISODES_ENDPOINTS.byFilm(filmId), { accessToken });
  },

  create(filmId: string, body: CreateEpisodeInput, accessToken: string) {
    return request<Episode>(EPISODES_ENDPOINTS.byFilm(filmId), {
      method: 'POST',
      body,
      accessToken,
    });
  },

  update(id: string, body: UpdateEpisodeInput, accessToken: string) {
    return request<Episode>(EPISODES_ENDPOINTS.update(id), { method: 'PATCH', body, accessToken });
  },

  remove(id: string, accessToken: string) {
    return request<null>(EPISODES_ENDPOINTS.remove(id), { method: 'DELETE', accessToken });
  },

  updateOrder(id: string, displayOrder: number, accessToken: string) {
    return request<Episode>(EPISODES_ENDPOINTS.updateOrder(id), {
      method: 'PATCH',
      body: { displayOrder },
      accessToken,
    });
  },
};
