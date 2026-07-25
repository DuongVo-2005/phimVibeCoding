import type { PaginatedResponse } from '@/lib/types/common';
import type { CreateFilmInput, FilmDetail, FilmSummary, UpdateFilmInput } from '@/lib/types/film';
import { request } from './client';
import { FILMS_ENDPOINTS } from './endpoints';
import type { LimitQueryParams, PaginationQueryParams } from './types';

/** Khớp `films.controller.ts` + `QueryFilmDto` thật (Phase 11.0/11.2 audit). */
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
    return request<PaginatedResponse<FilmSummary>>(FILMS_ENDPOINTS.list, { query, accessToken });
  },

  top(query?: FilmsTopQueryParams) {
    return request<FilmSummary[]>(FILMS_ENDPOINTS.top, { query });
  },

  hot(query?: LimitQueryParams) {
    return request<FilmSummary[]>(FILMS_ENDPOINTS.hot, { query });
  },

  latestSeries(query?: LimitQueryParams) {
    return request<FilmSummary[]>(FILMS_ENDPOINTS.latestSeries, { query });
  },

  mostCommented(query?: LimitQueryParams) {
    return request<FilmSummary[]>(FILMS_ENDPOINTS.mostCommented, { query });
  },

  bySlug(slug: string) {
    return request<FilmDetail>(FILMS_ENDPOINTS.bySlug(slug));
  },

  related(slug: string, query?: LimitQueryParams) {
    return request<FilmSummary[]>(FILMS_ENDPOINTS.related(slug), { query });
  },

  incrementView(slug: string) {
    return request<{ view: number }>(FILMS_ENDPOINTS.incrementView(slug), { method: 'POST' });
  },

  create(body: CreateFilmInput, accessToken: string) {
    return request<FilmDetail>(FILMS_ENDPOINTS.list, { method: 'POST', body, accessToken });
  },

  update(id: string, body: UpdateFilmInput, accessToken: string) {
    return request<FilmDetail>(FILMS_ENDPOINTS.byId(id), { method: 'PATCH', body, accessToken });
  },

  remove(id: string, accessToken: string) {
    return request<null>(FILMS_ENDPOINTS.byId(id), { method: 'DELETE', accessToken });
  },
};
