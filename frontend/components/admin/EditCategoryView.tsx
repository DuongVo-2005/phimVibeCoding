'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ErrorState } from '@/components/ui/ErrorState';
import { SkeletonBlock } from '@/components/ui/SkeletonBlock';
import { useNotification } from '@/hooks/useNotification';
import { ApiRequestError } from '@/lib/api/client';
import { useUpdateCategoryMutation } from '@/lib/query/mutations';
import { categoriesQueryOptions } from '@/lib/query/options';
import type { CreateCategoryInput, UpdateCategoryInput } from '@/lib/types/category';
import { CategoryForm } from './CategoryForm';

/** EditCategoryView — Phase 19B.3. Khác `EditMovieView`: `categories.service.ts`'s `findBySlug()`
 * KHÔNG lọc `isActive` (audit xác nhận) — thể loại đã ẩn vẫn sửa được bình thường, không có giới
 * hạn tương tự phim ẩn. */
export function EditCategoryView({ slug }: { slug: string }) {
  const router = useRouter();
  const notify = useNotification();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const updateMutation = useUpdateCategoryMutation();

  const {
    data: category,
    isLoading,
    isError,
    refetch,
  } = useQuery(categoriesQueryOptions.detail(slug));

  const handleSubmit = (body: CreateCategoryInput | UpdateCategoryInput) => {
    if (!category) return;
    setSubmitError(null);
    updateMutation.mutate(
      { id: category._id, body: body as UpdateCategoryInput },
      {
        onSuccess: () => {
          notify.success('Đã lưu thay đổi.');
          router.push('/admin/the-loai');
        },
        onError: (error) => {
          setSubmitError(
            error instanceof ApiRequestError ? error.message : 'Có lỗi xảy ra, vui lòng thử lại.',
          );
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-md max-w-2xl" aria-hidden="true">
        <SkeletonBlock className="h-8 w-1/3 rounded" />
        <SkeletonBlock className="h-72 rounded-2xl" />
      </div>
    );
  }

  if (isError || !category) {
    return <ErrorState message="Không tải được thông tin thể loại." onRetry={() => refetch()} />;
  }

  return (
    <div className="flex flex-col gap-lg max-w-2xl">
      <h1 className="text-headline-lg font-headline-lg text-on-surface">
        Sửa thể loại: {category.name}
      </h1>
      <CategoryForm
        mode="edit"
        initialCategory={category}
        onSubmit={handleSubmit}
        isSubmitting={updateMutation.isPending}
        submitError={submitError}
      />
    </div>
  );
}
