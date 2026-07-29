'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useNotification } from '@/hooks/useNotification';
import { ApiRequestError } from '@/lib/api/client';
import { useCreateCategoryMutation } from '@/lib/query/mutations';
import type { CreateCategoryInput, UpdateCategoryInput } from '@/lib/types/category';
import { CategoryForm } from './CategoryForm';

export function CreateCategoryView() {
  const router = useRouter();
  const notify = useNotification();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const createMutation = useCreateCategoryMutation();

  const handleSubmit = (body: CreateCategoryInput | UpdateCategoryInput) => {
    setSubmitError(null);
    createMutation.mutate(body as CreateCategoryInput, {
      onSuccess: () => {
        notify.success('Đã tạo thể loại thành công.');
        router.push('/admin/the-loai');
      },
      onError: (error) => {
        setSubmitError(
          error instanceof ApiRequestError ? error.message : 'Có lỗi xảy ra, vui lòng thử lại.',
        );
      },
    });
  };

  return (
    <div className="flex flex-col gap-lg max-w-2xl">
      <h1 className="text-headline-lg font-headline-lg text-on-surface">Tạo thể loại mới</h1>
      <CategoryForm
        mode="create"
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending}
        submitError={submitError}
      />
    </div>
  );
}
