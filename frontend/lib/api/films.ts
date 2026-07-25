import { request } from './client';
import { FILMS_ENDPOINTS } from './endpoints';
import type { LimitQueryParams, PaginatedResult, PaginationQueryParams } from './types';

/**
 * Khớp `films.controller.ts` + `QueryFilmDto` (Phase 9.2 audit). Chưa gọi thật ở đâu — chỉ
 * skeleton sẵn sàng cho hook/page dùng ở phase sau. Response/body payload để `unknown` (chưa
 * model domain Film đầy đủ — ngoài phạm vi "API foundation", tránh suy đoán trước field).
 */
export type FilmsQueryParams = PaginationQueryParams & {
  search?: string;
  category?: string;
  country?: string;
  director?: string;
  format?: string;
  status?: string;
  year?: string;
  isPublished?: boolean;
};

export type FilmsTopQueryParams = {
  limit?: number;
  metric?: 'view' | 'ratingAvg';
};

export const filmsApi = {
  list(query?: FilmsQueryParams, accessToken?: string) {
    return request<PaginatedResult<unknown>>(FILMS_ENDPOINTS.list, { query, accessToken });
  },

  top(query?: FilmsTopQueryParams) {
    return request<unknown[]>(FILMS_ENDPOINTS.top, { query });
  },

  hot(query?: LimitQueryParams) {
    return request<unknown[]>(FILMS_ENDPOINTS.hot, { query });
  },

  latestSeries(query?: LimitQueryParams) {
    return request<unknown[]>(FILMS_ENDPOINTS.latestSeries, { query });
  },

  mostCommented(query?: LimitQueryParams) {
    return request<unknown[]>(FILMS_ENDPOINTS.mostCommented, { query });
  },

  bySlug(slug: string) {
    return request<unknown>(FILMS_ENDPOINTS.bySlug(slug));
  },

  related(slug: string, query?: LimitQueryParams) {
    return request<unknown[]>(FILMS_ENDPOINTS.related(slug), { query });
  },

  incrementView(slug: string) {
    return request<{ view: number }>(FILMS_ENDPOINTS.incrementView(slug), { method: 'POST' });
  },

  create(body: unknown, accessToken: string) {
    return request<unknown>(FILMS_ENDPOINTS.list, { method: 'POST', body, accessToken });
  },

  update(id: string, body: unknown, accessToken: string) {
    return request<unknown>(FILMS_ENDPOINTS.byId(id), { method: 'PATCH', body, accessToken });
  },

  remove(id: string, accessToken: string) {
    return request<null>(FILMS_ENDPOINTS.byId(id), { method: 'DELETE', accessToken });
  },
};
