'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  CATEGORY_FORM_DEFAULTS,
  categoryFormSchema,
  type CategoryFormValues,
} from '@/lib/validation/category';
import type { Category, CreateCategoryInput, UpdateCategoryInput } from '@/lib/types/category';

function categoryToFormValues(category: Category): CategoryFormValues {
  return {
    name: category.name,
    description: category.description ?? '',
    seoTitle: category.seoTitle ?? '',
    seoDescription: category.seoDescription ?? '',
    isActive: category.isActive,
    isHot: category.isHot,
  };
}

function formValuesToBody(values: CategoryFormValues): CreateCategoryInput {
  return {
    name: values.name.trim(),
    description: values.description?.trim() || undefined,
    seoTitle: values.seoTitle?.trim() || undefined,
    seoDescription: values.seoDescription?.trim() || undefined,
    isActive: values.isActive,
    isHot: values.isHot,
  };
}

/** CategoryForm — form dùng chung Create + Edit thể loại (Phase 19B.3). Không có quan hệ/multi-
 * select nào (khác `MovieForm`) — `CreateCategoryDto` chỉ có field vô hướng. */
export function CategoryForm({
  mode,
  initialCategory,
  onSubmit,
  isSubmitting,
  submitError,
}: {
  mode: 'create' | 'edit';
  initialCategory?: Category;
  onSubmit: (body: CreateCategoryInput | UpdateCategoryInput) => void;
  isSubmitting: boolean;
  submitError: string | null;
}) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: initialCategory ? categoryToFormValues(initialCategory) : CATEGORY_FORM_DEFAULTS,
  });

  const submit = (values: CategoryFormValues) => onSubmit(formValuesToBody(values));

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="flex flex-col gap-lg">
      <section className="flex flex-col gap-md rounded-2xl bg-surface-container p-lg">
        <Input label="Tên thể loại" error={errors.name?.message} {...register('name')} />
        <div className="flex flex-col gap-xs">
          <label
            htmlFor="category-description"
            className="text-label-md font-label-md text-on-surface-variant"
          >
            Mô tả
          </label>
          <textarea
            id="category-description"
            rows={3}
            {...register('description')}
            className="bg-surface-container-high border border-transparent rounded-xl px-md py-base text-body-md text-on-surface outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
        </div>
        <Input
          label="SEO Title (tối đa 70 ký tự)"
          error={errors.seoTitle?.message}
          {...register('seoTitle')}
        />
        <Input
          label="SEO Description (tối đa 160 ký tự)"
          error={errors.seoDescription?.message}
          {...register('seoDescription')}
        />
        <label className="flex items-center gap-sm text-body-md text-on-surface">
          <input type="checkbox" className="h-5 w-5" {...register('isActive')} />
          Hoạt động (bỏ chọn để ẩn thể loại khỏi trang người dùng)
        </label>
        <label className="flex items-center gap-sm text-body-md text-on-surface">
          <input type="checkbox" className="h-5 w-5" {...register('isHot')} />
          Đánh dấu là thể loại nổi bật (Hot)
        </label>
      </section>

      {submitError ? (
        <p role="alert" className="text-label-md text-error">
          {submitError}
        </p>
      ) : null}

      <div className="flex justify-end gap-sm">
        <Button variant="secondary" type="button" onClick={() => router.push('/admin/the-loai')}>
          Huỷ
        </Button>
        <Button type="submit" variant="primary" disabled={isSubmitting}>
          {isSubmitting ? 'Đang lưu...' : mode === 'create' ? 'Tạo thể loại' : 'Lưu thay đổi'}
        </Button>
      </div>
    </form>
  );
}
