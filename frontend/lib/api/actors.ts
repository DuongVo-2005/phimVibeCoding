import { request } from './client';
import { ACTORS_ENDPOINTS } from './endpoints';
import type { PaginatedResult, PaginationQueryParams } from './types';

/** Khớp `actors.controller.ts` + `QueryActorDto` (Phase 9.2 audit). Chưa gọi thật ở đâu. */
export type ActorsQueryParams = PaginationQueryParams & {
  search?: string;
  letter?: string;
};

export const actorsApi = {
  list(query?: ActorsQueryParams) {
    return request<PaginatedResult<unknown>>(ACTORS_ENDPOINTS.list, { query });
  },

  bySlug(slug: string) {
    return request<unknown>(ACTORS_ENDPOINTS.bySlug(slug));
  },

  create(body: unknown, accessToken: string) {
    return request<unknown>(ACTORS_ENDPOINTS.list, { method: 'POST', body, accessToken });
  },

  update(id: string, body: unknown, accessToken: string) {
    return request<unknown>(ACTORS_ENDPOINTS.byId(id), { method: 'PATCH', body, accessToken });
  },

  remove(id: string, accessToken: string) {
    return request<null>(ACTORS_ENDPOINTS.byId(id), { method: 'DELETE', accessToken });
  },
};
