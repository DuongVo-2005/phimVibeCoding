'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useNotification } from '@/hooks/useNotification';
import { ApiRequestError } from '@/lib/api/client';
import { useCreateCountryMutation } from '@/lib/query/mutations';
import type { CreateCountryInput, UpdateCountryInput } from '@/lib/types/country';
import { CountryForm } from './CountryForm';

export function CreateCountryView() {
  const router = useRouter();
  const notify = useNotification();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const createMutation = useCreateCountryMutation();

  const handleSubmit = (body: CreateCountryInput | UpdateCountryInput) => {
    setSubmitError(null);
    createMutation.mutate(body as CreateCountryInput, {
      onSuccess: () => {
        notify.success('Đã tạo quốc gia thành công.');
        router.push('/admin/quoc-gia');
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
      <h1 className="text-headline-lg font-headline-lg text-on-surface">Tạo quốc gia mới</h1>
      <CountryForm
        mode="create"
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending}
        submitError={submitError}
      />
    </div>
  );
}
