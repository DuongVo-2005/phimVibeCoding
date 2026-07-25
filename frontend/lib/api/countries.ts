import type { Country, CreateCountryInput, UpdateCountryInput } from '@/lib/types/country';
import { request } from './client';
import { COUNTRIES_ENDPOINTS } from './endpoints';

/**
 * countriesApi — Phase 11.2 (mục B trong audit: nên có cho bộ lọc quốc gia ở Movie Listing).
 * Khớp `countries.controller.ts` thật (Phase 11.0 audit). `GET /countries` trả mảng trần, KHÔNG
 * phân trang (không có `@Query()` phân trang ở controller — cùng dạng `categories`/`playlists`).
 * Chưa gọi thật ở đâu.
 */
export const countriesApi = {
  list() {
    return request<Country[]>(COUNTRIES_ENDPOINTS.list);
  },

  bySlug(slug: string) {
    return request<Country>(COUNTRIES_ENDPOINTS.bySlug(slug));
  },

  create(body: CreateCountryInput, accessToken: string) {
    return request<Country>(COUNTRIES_ENDPOINTS.list, { method: 'POST', body, accessToken });
  },

  update(id: string, body: UpdateCountryInput, accessToken: string) {
    return request<Country>(COUNTRIES_ENDPOINTS.byId(id), {
      method: 'PATCH',
      body,
      accessToken,
    });
  },

  remove(id: string, accessToken: string) {
    return request<null>(COUNTRIES_ENDPOINTS.byId(id), { method: 'DELETE', accessToken });
  },
};
