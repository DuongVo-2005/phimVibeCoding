import type { Category, CreateCategoryInput, UpdateCategoryInput } from '@/lib/types/category';
import { request } from './client';
import { CATEGORIES_ENDPOINTS } from './endpoints';

/** Khớp `categories.controller.ts` + `QueryCategoryDto` thật (Phase 11.0/11.2 audit). */
export type CategoriesQueryParams = {
  isActive?: boolean;
};

export const categoriesApi = {
  list(query?: CategoriesQueryParams) {
    return request<Category[]>(CATEGORIES_ENDPOINTS.list, { query });
  },

  hot() {
    return request<Category[]>(CATEGORIES_ENDPOINTS.hot);
  },

  bySlug(slug: string) {
    return request<Category>(CATEGORIES_ENDPOINTS.bySlug(slug));
  },

  create(body: CreateCategoryInput, accessToken: string) {
    return request<Category>(CATEGORIES_ENDPOINTS.list, { method: 'POST', body, accessToken });
  },

  update(id: string, body: UpdateCategoryInput, accessToken: string) {
    return request<Category>(CATEGORIES_ENDPOINTS.byId(id), {
      method: 'PATCH',
      body,
      accessToken,
    });
  },

  remove(id: string, accessToken: string) {
    return request<null>(CATEGORIES_ENDPOINTS.byId(id), { method: 'DELETE', accessToken });
  },
};
