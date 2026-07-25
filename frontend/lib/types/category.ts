/**
 * Khớp `categories/schemas/category.schema.ts` thật (Phase 11.0 audit — `name,slug,description,
 * seoTitle,seoDescription,source,sourceSlug,sourceUpdatedAt,isActive,isHot`). `_id` (không phải
 * `id`) — Mongoose document serialize nguyên `_id`, không có transform đổi tên field nào được
 * xác nhận ở `main.ts` (chỉ có `TransformInterceptor` bọc envelope, không đổi field entity).
 */
export interface CategoryRef {
  _id: string;
  name: string;
  slug: string;
}

export interface Category extends CategoryRef {
  description: string;
  seoTitle: string;
  seoDescription: string;
  source: string | null;
  sourceSlug: string | null;
  sourceUpdatedAt: string | null;
  isActive: boolean;
  isHot: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryInput {
  name: string;
  description?: string;
  seoTitle?: string;
  seoDescription?: string;
  isActive?: boolean;
  isHot?: boolean;
}

export type UpdateCategoryInput = Partial<CreateCategoryInput>;
