'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ErrorState } from '@/components/ui/ErrorState';
import { SkeletonBlock } from '@/components/ui/SkeletonBlock';
import { useNotification } from '@/hooks/useNotification';
import { ApiRequestError } from '@/lib/api/client';
import { useUpdateActorMutation } from '@/lib/query/mutations';
import { actorsQueryOptions } from '@/lib/query/options';
import type { CreateActorInput, UpdateActorInput } from '@/lib/types/actor';
import { ActorForm } from './ActorForm';

export function EditActorView({ slug }: { slug: string }) {
  const router = useRouter();
  const notify = useNotification();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const updateMutation = useUpdateActorMutation();

  const { data: actor, isLoading, isError, refetch } = useQuery(actorsQueryOptions.detail(slug));

  const handleSubmit = (body: CreateActorInput | UpdateActorInput) => {
    if (!actor) return;
    setSubmitError(null);
    updateMutation.mutate(
      { id: actor._id, body: body as UpdateActorInput },
      {
        onSuccess: () => {
          notify.success('Đã lưu thay đổi.');
          router.push('/admin/dien-vien');
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

  if (isError || !actor) {
    return <ErrorState message="Không tải được thông tin diễn viên." onRetry={() => refetch()} />;
  }

  return (
    <div className="flex flex-col gap-lg max-w-2xl">
      <h1 className="text-headline-lg font-headline-lg text-on-surface">
        Sửa diễn viên: {actor.name}
      </h1>
      <ActorForm
        mode="edit"
        initialActor={actor}
        onSubmit={handleSubmit}
        isSubmitting={updateMutation.isPending}
        submitError={submitError}
      />
    </div>
  );
}
