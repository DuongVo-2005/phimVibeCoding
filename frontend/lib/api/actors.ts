import type {
  ActorDetail,
  ActorSummary,
  CreateActorInput,
  UpdateActorInput,
} from '@/lib/types/actor';
import type { PaginatedResponse } from '@/lib/types/common';
import { request } from './client';
import { ACTORS_ENDPOINTS } from './endpoints';
import type { PaginationQueryParams } from './types';

/** Khớp `actors.controller.ts` + `QueryActorDto` thật (Phase 11.0/11.2 audit). */
export type ActorsQueryParams = PaginationQueryParams & {
  search?: string;
  letter?: string;
};

export const actorsApi = {
  list(query?: ActorsQueryParams) {
    return request<PaginatedResponse<ActorSummary>>(ACTORS_ENDPOINTS.list, { query });
  },

  bySlug(slug: string) {
    return request<ActorDetail>(ACTORS_ENDPOINTS.bySlug(slug));
  },

  create(body: CreateActorInput, accessToken: string) {
    return request<ActorDetail>(ACTORS_ENDPOINTS.list, { method: 'POST', body, accessToken });
  },

  update(id: string, body: UpdateActorInput, accessToken: string) {
    return request<ActorDetail>(ACTORS_ENDPOINTS.byId(id), { method: 'PATCH', body, accessToken });
  },

  remove(id: string, accessToken: string) {
    return request<null>(ACTORS_ENDPOINTS.byId(id), { method: 'DELETE', accessToken });
  },
};
