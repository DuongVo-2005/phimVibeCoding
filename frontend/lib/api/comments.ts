import type {
  Comment,
  CommentModerationItem,
  CreateCommentInput,
  SetCommentVisibilityInput,
  UpdateCommentInput,
  VoteCommentInput,
} from '@/lib/types/comment';
import type { PaginatedResponse } from '@/lib/types/common';
import { request } from './client';
import { COMMENTS_ENDPOINTS } from './endpoints';
import type { LimitQueryParams, PaginationQueryParams } from './types';

/** Khớp `comments.controller.ts` + Query DTO thật (Phase 11.0/11.2 audit). */
export type CommentsByFilmQueryParams = PaginationQueryParams & {
  sort?: 'new' | 'top';
};

export type CommentsModerationQueryParams = PaginationQueryParams & {
  filmId?: string;
  userId?: string;
};

export const commentsApi = {
  byFilm(filmId: string, query?: CommentsByFilmQueryParams) {
    return request<PaginatedResponse<Comment>>(COMMENTS_ENDPOINTS.byFilm(filmId), { query });
  },

  replies(id: string, query?: PaginationQueryParams) {
    return request<PaginatedResponse<Comment>>(COMMENTS_ENDPOINTS.replies(id), { query });
  },

  topVoted(query?: LimitQueryParams) {
    return request<Comment[]>(COMMENTS_ENDPOINTS.topVoted, { query });
  },

  latest(query?: LimitQueryParams) {
    return request<Comment[]>(COMMENTS_ENDPOINTS.latest, { query });
  },

  /** Trả `CommentModerationItem[]` — KHÁC `Comment` thường, `film` được populate đầy đủ (xem ghi
   * chú tại type). */
  moderationList(query: CommentsModerationQueryParams | undefined, accessToken: string) {
    return request<PaginatedResponse<CommentModerationItem>>(COMMENTS_ENDPOINTS.moderationList, {
      query,
      accessToken,
    });
  },

  create(body: CreateCommentInput, accessToken: string) {
    return request<Comment>(COMMENTS_ENDPOINTS.create, { method: 'POST', body, accessToken });
  },

  vote(id: string, body: VoteCommentInput, accessToken: string) {
    return request<Comment>(COMMENTS_ENDPOINTS.vote(id), { method: 'POST', body, accessToken });
  },

  update(id: string, body: UpdateCommentInput, accessToken: string) {
    return request<Comment>(COMMENTS_ENDPOINTS.update(id), {
      method: 'PATCH',
      body,
      accessToken,
    });
  },

  setVisibility(id: string, body: SetCommentVisibilityInput, accessToken: string) {
    return request<Comment>(COMMENTS_ENDPOINTS.setVisibility(id), {
      method: 'PATCH',
      body,
      accessToken,
    });
  },

  remove(id: string, accessToken: string) {
    return request<null>(COMMENTS_ENDPOINTS.remove(id), { method: 'DELETE', accessToken });
  },
};
