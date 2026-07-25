import type { CreateRatingInput, Rating, RatingSummary } from '@/lib/types/rating';
import { request } from './client';
import { RATINGS_ENDPOINTS } from './endpoints';

/**
 * ratingsApi — Phase 11.2 (mục A trong audit: thiếu hẳn trước phase này, cần cho Movie Detail).
 * Khớp `ratings.controller.ts` thật (Phase 11.0 audit). `summary` là Public; `mine`/`create`/
 * `remove` yêu cầu access token. Chưa gọi thật ở đâu.
 */
export const ratingsApi = {
  summary(filmId: string) {
    return request<RatingSummary>(RATINGS_ENDPOINTS.summary(filmId));
  },

  mine(filmId: string, accessToken: string) {
    return request<Rating | null>(RATINGS_ENDPOINTS.mine(filmId), { accessToken });
  },

  create(filmId: string, body: CreateRatingInput, accessToken: string) {
    return request<Rating>(RATINGS_ENDPOINTS.byFilm(filmId), {
      method: 'POST',
      body,
      accessToken,
    });
  },

  remove(filmId: string, accessToken: string) {
    return request<null>(RATINGS_ENDPOINTS.byFilm(filmId), { method: 'DELETE', accessToken });
  },
};
