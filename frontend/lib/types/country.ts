/**
 * Khớp `countries/schemas/country.schema.ts` thật (Phase 11.0 audit — `name,slug,code`).
 * `countriesApi` chưa tồn tại trước Phase 11.2 — tạo mới cùng lúc với type này (nhóm A/B trong
 * audit: "nên có" cho bộ lọc quốc gia ở Movie Listing, không thuộc phạm vi UI của phase này).
 */
export interface CountryRef {
  _id: string;
  name: string;
  slug: string;
}

export interface Country extends CountryRef {
  code: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCountryInput {
  name: string;
  code?: string;
}

export type UpdateCountryInput = Partial<CreateCountryInput>;
