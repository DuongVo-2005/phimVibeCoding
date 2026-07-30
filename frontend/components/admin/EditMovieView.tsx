'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { SkeletonBlock } from '@/components/ui/SkeletonBlock';
import { useNotification } from '@/hooks/useNotification';
import { ApiRequestError } from '@/lib/api/client';
import { useUpdateFilmMutation } from '@/lib/query/mutations';
import { filmsQueryOptions } from '@/lib/query/options';
import type { CreateFilmInput, UpdateFilmInput } from '@/lib/types/film';
import { EpisodeManagement } from './EpisodeManagement';
import { MovieForm } from './MovieForm';

/**
 * EditMovieView — Phase 19B.2. LIMITATION đã ghi nhận trong báo cáo phase: `GET /films/:slug`
 * (endpoint DUY NHẤT trả chi tiết đầy đủ để điền form) hardcode `isPublished:true` ở
 * `films.service.ts`'s `findBySlug()` — KHÔNG có nhánh admin bypass như `GET /films` (list). Phim
 * đang ẨN sẽ luôn 404 ở bước này, không có cách nào lấy đủ dữ liệu (description/trailerUrl/
 * language/actors — các field KHÔNG có trên `FilmSummary` từ danh sách) để điền form an toàn.
 * KHÔNG tự thêm endpoint — hiện thông báo rõ ràng thay vì form nửa vời (rủi ro submit đè mất
 * actors/description cũ nếu cố điền bằng dữ liệu thiếu).
 */
export function EditMovieView({ slug }: { slug: string }) {
  const router = useRouter();
  const notify = useNotification();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const updateMutation = useUpdateFilmMutation();

  const {
    data: film,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery(filmsQueryOptions.detail(slug));

  const handleSubmit = (body: CreateFilmInput | UpdateFilmInput) => {
    if (!film) return;
    setSubmitError(null);
    updateMutation.mutate(
      { id: film._id, body: body as UpdateFilmInput },
      {
        onSuccess: () => {
          notify.success('Đã lưu thay đổi.');
          router.push('/admin/phim');
        },
        onError: (mutationError) => {
          setSubmitError(
            mutationError instanceof ApiRequestError
              ? mutationError.message
              : 'Có lỗi xảy ra, vui lòng thử lại.',
          );
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-md max-w-3xl" aria-hidden="true">
        <SkeletonBlock className="h-8 w-1/3 rounded" />
        <SkeletonBlock className="h-64 rounded-2xl" />
        <SkeletonBlock className="h-48 rounded-2xl" />
      </div>
    );
  }

  if (isError) {
    const is404 = error instanceof ApiRequestError && error.statusCode === 404;
    if (is404) {
      return (
        <EmptyState
          icon="visibility_off"
          message="Không thể tải phim này để sửa."
          subtitle="Phim có thể đang ở trạng thái Ẩn — API chi tiết hiện chỉ trả phim Hiển thị công khai (giới hạn backend, xem báo cáo Phase 19B.2). Hãy Hiển thị lại phim trước, hoặc yêu cầu bổ sung API."
        />
      );
    }
    return <ErrorState message="Không tải được thông tin phim." onRetry={() => refetch()} />;
  }

  if (!film) return null;

  return (
    <div className="flex flex-col gap-lg max-w-3xl">
      <h1 className="text-headline-lg font-headline-lg text-on-surface">Sửa phim: {film.title}</h1>
      <MovieForm
        mode="edit"
        initialFilm={film}
        onSubmit={handleSubmit}
        isSubmitting={updateMutation.isPending}
        submitError={submitError}
      />
      <EpisodeManagement filmId={film._id} filmTitle={film.title} />
    </div>
  );
}
