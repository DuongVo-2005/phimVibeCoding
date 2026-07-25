import { request } from './client';
import { CATEGORIES_ENDPOINTS } from './endpoints';

/** Khớp `categories.controller.ts` + `QueryCategoryDto` (Phase 9.2 audit). Chưa gọi thật ở đâu. */
export interface CategoriesQueryParams {
  isActive?: boolean;
}

export const categoriesApi = {
  list(query?: CategoriesQueryParams) {
    return request<unknown[]>(CATEGORIES_ENDPOINTS.list, { query });
  },

  hot() {
    return request<unknown[]>(CATEGORIES_ENDPOINTS.hot);
  },

  bySlug(slug: string) {
    return request<unknown>(CATEGORIES_ENDPOINTS.bySlug(slug));
  },

  create(body: unknown, accessToken: string) {
    return request<unknown>(CATEGORIES_ENDPOINTS.list, { method: 'POST', body, accessToken });
  },

  update(id: string, body: unknown, accessToken: string) {
    return request<unknown>(CATEGORIES_ENDPOINTS.byId(id), {
      method: 'PATCH',
      body,
      accessToken,
    });
  },

  remove(id: string, accessToken: string) {
    return request<null>(CATEGORIES_ENDPOINTS.byId(id), { method: 'DELETE', accessToken });
  },
};
