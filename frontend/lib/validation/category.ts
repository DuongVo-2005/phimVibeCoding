import { z } from 'zod';

/** Khớp `CreateCategoryDto`/`UpdateCategoryDto` thật (backend/src/categories/dto/*.dto.ts) —
 * `UpdateCategoryDto = PartialType(CreateCategoryDto)` KHÔNG omit field nào (khác Films). */
export const categoryFormSchema = z.object({
  name: z.string().trim().min(1, 'Vui lòng nhập tên thể loại'),
  description: z.string().trim().optional(),
  seoTitle: z.string().trim().max(70, 'Tối đa 70 ký tự').optional(),
  seoDescription: z.string().trim().max(160, 'Tối đa 160 ký tự').optional(),
  isActive: z.boolean(),
  isHot: z.boolean(),
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;

export const CATEGORY_FORM_DEFAULTS: CategoryFormValues = {
  name: '',
  description: '',
  seoTitle: '',
  seoDescription: '',
  isActive: true,
  isHot: false,
};
