import { request } from './client';
import { COMMENTS_ENDPOINTS } from './endpoints';
import type { LimitQueryParams, PaginatedResult, PaginationQueryParams } from './types';

/** Khớp `comments.controller.ts` + Query DTO tương ứng (Phase 9.2 audit). Chưa gọi thật ở đâu. */
export interface CommentsByFilmQueryParams extends PaginationQueryParams {
  sort?: 'new' | 'top';
}

export interface CommentsModerationQueryParams extends PaginationQueryParams {
  filmId?: string;
  userId?: string;
}

export const commentsApi = {
  byFilm(filmId: string, query?: CommentsByFilmQueryParams) {
    return request<PaginatedResult<unknown>>(COMMENTS_ENDPOINTS.byFilm(filmId), { query });
  },

  replies(id: string, query?: PaginationQueryParams) {
    return request<PaginatedResult<unknown>>(COMMENTS_ENDPOINTS.replies(id), { query });
  },

  topVoted(query?: LimitQueryParams) {
    return request<unknown[]>(COMMENTS_ENDPOINTS.topVoted, { query });
  },

  latest(query?: LimitQueryParams) {
    return request<unknown[]>(COMMENTS_ENDPOINTS.latest, { query });
  },

  moderationList(query: CommentsModerationQueryParams | undefined, accessToken: string) {
    return request<PaginatedResult<unknown>>(COMMENTS_ENDPOINTS.moderationList, {
      query,
      accessToken,
    });
  },

  create(body: unknown, accessToken: string) {
    return request<unknown>(COMMENTS_ENDPOINTS.create, { method: 'POST', body, accessToken });
  },

  vote(id: string, body: unknown, accessToken: string) {
    return request<unknown>(COMMENTS_ENDPOINTS.vote(id), { method: 'POST', body, accessToken });
  },

  update(id: string, body: unknown, accessToken: string) {
    return request<unknown>(COMMENTS_ENDPOINTS.update(id), { method: 'PATCH', body, accessToken });
  },

  setVisibility(id: string, body: unknown, accessToken: string) {
    return request<unknown>(COMMENTS_ENDPOINTS.setVisibility(id), {
      method: 'PATCH',
      body,
      accessToken,
    });
  },

  remove(id: string, accessToken: string) {
    return request<null>(COMMENTS_ENDPOINTS.remove(id), { method: 'DELETE', accessToken });
  },
};
