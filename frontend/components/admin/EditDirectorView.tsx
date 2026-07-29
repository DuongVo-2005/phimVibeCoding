'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ErrorState } from '@/components/ui/ErrorState';
import { SkeletonBlock } from '@/components/ui/SkeletonBlock';
import { useNotification } from '@/hooks/useNotification';
import { ApiRequestError } from '@/lib/api/client';
import { useUpdateDirectorMutation } from '@/lib/query/mutations';
import { directorsQueryOptions } from '@/lib/query/options';
import type { CreateDirectorInput, UpdateDirectorInput } from '@/lib/types/director';
import { DirectorForm } from './DirectorForm';

export function EditDirectorView({ slug }: { slug: string }) {
  const router = useRouter();
  const notify = useNotification();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const updateMutation = useUpdateDirectorMutation();

  const {
    data: director,
    isLoading,
    isError,
    refetch,
  } = useQuery(directorsQueryOptions.detail(slug));

  const handleSubmit = (body: CreateDirectorInput | UpdateDirectorInput) => {
    if (!director) return;
    setSubmitError(null);
    updateMutation.mutate(
      { id: director._id, body: body as UpdateDirectorInput },
      {
        onSuccess: () => {
          notify.success('Đã lưu thay đổi.');
          router.push('/admin/dao-dien');
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

  if (isError || !director) {
    return <ErrorState message="Không tải được thông tin đạo diễn." onRetry={() => refetch()} />;
  }

  return (
    <div className="flex flex-col gap-lg max-w-2xl">
      <h1 className="text-headline-lg font-headline-lg text-on-surface">
        Sửa đạo diễn: {director.name}
      </h1>
      <DirectorForm
        mode="edit"
        initialDirector={director}
        onSubmit={handleSubmit}
        isSubmitting={updateMutation.isPending}
        submitError={submitError}
      />
    </div>
  );
}
