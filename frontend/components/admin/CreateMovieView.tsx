'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useNotification } from '@/hooks/useNotification';
import { ApiRequestError } from '@/lib/api/client';
import { useCreateFilmMutation } from '@/lib/query/mutations';
import type { CreateFilmInput, UpdateFilmInput } from '@/lib/types/film';
import { MovieForm } from './MovieForm';

/** CreateMovieView — Phase 19B.2. `POST /films` đã có sẵn, đủ dữ liệu để tạo phim (không có
 * episodes/upload — xem `MovieForm`). Tạo xong điều hướng thẳng sang trang Edit của phim vừa tạo
 * (dùng `slug` trả về) — cho phép xem lại ngay, không cần quay về danh sách trước. */
export function CreateMovieView() {
  const router = useRouter();
  const notify = useNotification();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const createMutation = useCreateFilmMutation();

  const handleSubmit = (body: CreateFilmInput | UpdateFilmInput) => {
    setSubmitError(null);
    createMutation.mutate(body as CreateFilmInput, {
      onSuccess: (film) => {
        notify.success('Đã tạo phim thành công.');
        router.push(`/admin/phim/${film.slug}`);
      },
      onError: (error) => {
        setSubmitError(
          error instanceof ApiRequestError ? error.message : 'Có lỗi xảy ra, vui lòng thử lại.',
        );
      },
    });
  };

  return (
    <div className="flex flex-col gap-lg max-w-3xl">
      <h1 className="text-headline-lg font-headline-lg text-on-surface">Tạo phim mới</h1>
      <MovieForm
        mode="create"
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending}
        submitError={submitError}
      />
    </div>
  );
}
