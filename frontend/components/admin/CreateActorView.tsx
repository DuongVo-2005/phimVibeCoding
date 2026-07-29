'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useNotification } from '@/hooks/useNotification';
import { ApiRequestError } from '@/lib/api/client';
import { useCreateActorMutation } from '@/lib/query/mutations';
import type { CreateActorInput, UpdateActorInput } from '@/lib/types/actor';
import { ActorForm } from './ActorForm';

export function CreateActorView() {
  const router = useRouter();
  const notify = useNotification();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const createMutation = useCreateActorMutation();

  const handleSubmit = (body: CreateActorInput | UpdateActorInput) => {
    setSubmitError(null);
    createMutation.mutate(body as CreateActorInput, {
      onSuccess: () => {
        notify.success('Đã tạo diễn viên thành công.');
        router.push('/admin/dien-vien');
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
      <h1 className="text-headline-lg font-headline-lg text-on-surface">Tạo diễn viên mới</h1>
      <ActorForm
        mode="create"
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending}
        submitError={submitError}
      />
    </div>
  );
}
