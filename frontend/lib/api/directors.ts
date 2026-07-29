import type {
  CreateDirectorInput,
  DirectorDetail,
  DirectorSummary,
  UpdateDirectorInput,
} from '@/lib/types/director';
import type { PaginatedResponse } from '@/lib/types/common';
import { request } from './client';
import { DIRECTORS_ENDPOINTS } from './endpoints';
import type { PaginationQueryParams } from './types';

/** Khớp `directors.controller.ts` + `QueryDirectorDto` thật. Có phân trang + `search` (khác
 * `categories`/`countries` — mảng trần không phân trang) — cùng shape `actors`. */
export type DirectorsQueryParams = PaginationQueryParams & {
  search?: string;
};

export const directorsApi = {
  list(query?: DirectorsQueryParams) {
    return request<PaginatedResponse<DirectorSummary>>(DIRECTORS_ENDPOINTS.list, { query });
  },

  bySlug(slug: string) {
    return request<DirectorDetail>(DIRECTORS_ENDPOINTS.bySlug(slug));
  },

  create(body: CreateDirectorInput, accessToken: string) {
    return request<DirectorDetail>(DIRECTORS_ENDPOINTS.list, {
      method: 'POST',
      body,
      accessToken,
    });
  },

  update(id: string, body: UpdateDirectorInput, accessToken: string) {
    return request<DirectorDetail>(DIRECTORS_ENDPOINTS.byId(id), {
      method: 'PATCH',
      body,
      accessToken,
    });
  },

  remove(id: string, accessToken: string) {
    return request<null>(DIRECTORS_ENDPOINTS.byId(id), { method: 'DELETE', accessToken });
  },
};
