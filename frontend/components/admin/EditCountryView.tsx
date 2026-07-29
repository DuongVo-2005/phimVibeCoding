'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ErrorState } from '@/components/ui/ErrorState';
import { SkeletonBlock } from '@/components/ui/SkeletonBlock';
import { useNotification } from '@/hooks/useNotification';
import { ApiRequestError } from '@/lib/api/client';
import { useUpdateCountryMutation } from '@/lib/query/mutations';
import { countriesQueryOptions } from '@/lib/query/options';
import type { CreateCountryInput, UpdateCountryInput } from '@/lib/types/country';
import { CountryForm } from './CountryForm';

export function EditCountryView({ slug }: { slug: string }) {
  const router = useRouter();
  const notify = useNotification();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const updateMutation = useUpdateCountryMutation();

  const {
    data: country,
    isLoading,
    isError,
    refetch,
  } = useQuery(countriesQueryOptions.detail(slug));

  const handleSubmit = (body: CreateCountryInput | UpdateCountryInput) => {
    if (!country) return;
    setSubmitError(null);
    updateMutation.mutate(
      { id: country._id, body: body as UpdateCountryInput },
      {
        onSuccess: () => {
          notify.success('Đã lưu thay đổi.');
          router.push('/admin/quoc-gia');
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
        <SkeletonBlock className="h-48 rounded-2xl" />
      </div>
    );
  }

  if (isError || !country) {
    return <ErrorState message="Không tải được thông tin quốc gia." onRetry={() => refetch()} />;
  }

  return (
    <div className="flex flex-col gap-lg max-w-2xl">
      <h1 className="text-headline-lg font-headline-lg text-on-surface">
        Sửa quốc gia: {country.name}
      </h1>
      <CountryForm
        mode="edit"
        initialCountry={country}
        onSubmit={handleSubmit}
        isSubmitting={updateMutation.isPending}
        submitError={submitError}
      />
    </div>
  );
}
