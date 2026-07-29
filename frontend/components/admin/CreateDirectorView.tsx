'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useNotification } from '@/hooks/useNotification';
import { ApiRequestError } from '@/lib/api/client';
import { useCreateDirectorMutation } from '@/lib/query/mutations';
import type { CreateDirectorInput, UpdateDirectorInput } from '@/lib/types/director';
import { DirectorForm } from './DirectorForm';

export function CreateDirectorView() {
  const router = useRouter();
  const notify = useNotification();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const createMutation = useCreateDirectorMutation();

  const handleSubmit = (body: CreateDirectorInput | UpdateDirectorInput) => {
    setSubmitError(null);
    createMutation.mutate(body as CreateDirectorInput, {
      onSuccess: () => {
        notify.success('Đã tạo đạo diễn thành công.');
        router.push('/admin/dao-dien');
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
      <h1 className="text-headline-lg font-headline-lg text-on-surface">Tạo đạo diễn mới</h1>
      <DirectorForm
        mode="create"
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending}
        submitError={submitError}
      />
    </div>
  );
}
