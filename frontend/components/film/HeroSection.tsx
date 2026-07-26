'use client';

import { useQuery } from '@tanstack/react-query';
import { ErrorState } from '@/components/ui/ErrorState';
import { SkeletonBlock } from '@/components/ui/SkeletonBlock';
import { filmsQueryOptions } from '@/lib/query/options';
import type { FilmSummary } from '@/lib/types/film';
import { HeroBanner } from './HeroBanner';

/**
 * Phase 11.4: wiring `GET /films/hot` cho Hero Banner — thay `_mock/homepage-data.ts`'s `heroFilm`.
 * Quyết định đã chốt (giữ nguyên ở Phase 16C): lấy phần tử đầu của `/films/hot`, KHÔNG gọi thêm
 * request lấy `description` (field đó chỉ có trên `FilmDetail`, không có trên `FilmSummary` mà
 * endpoint này trả về) — dùng chuỗi rỗng, `HeroBanner` tự ẩn `<p>` khi rỗng (Phase 16C).
 *
 * Phase 16C: thêm skeleton (khớp khung `h-[70vh] min-h-[480px]` thật, không animation) và
 * `ErrorState` (nút "Thử lại" gọi `refetch()`) — trước đây `isLoading`/`isError` không được đọc,
 * mọi trạng thái (đang tải/rỗng/lỗi) đều render giống hệt nhau (ẩn khối, CLS khi data về).
 */
function toMeta(film: FilmSummary): string {
  return [
    film.releaseYear ? String(film.releaseYear) : null,
    film.duration ?? null,
    film.categories[0]?.name ?? null,
    film.quality ?? null,
  ]
    .filter((part): part is string => Boolean(part))
    .join(' • ');
}

export function HeroSection() {
  const { data, isLoading, isError, refetch } = useQuery(filmsQueryOptions.hot());
  const film = data?.[0];

  if (isError) {
    return (
      <div className="px-gutter pt-xl">
        <ErrorState message="Không tải được nội dung nổi bật." onRetry={() => refetch()} />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="relative h-[70vh] min-h-[480px] w-full flex items-end pb-xl px-gutter overflow-hidden">
        <div className="relative z-10 max-w-3xl w-full space-y-md">
          <SkeletonBlock className="h-6 w-32 rounded" />
          <SkeletonBlock className="h-12 w-2/3 rounded" />
          <SkeletonBlock className="h-5 w-full rounded" />
          <div className="flex gap-md pt-base">
            <SkeletonBlock className="h-14 w-36 rounded-xl" />
            <SkeletonBlock className="h-14 w-36 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  // Rỗng thật (đã tải xong, backend không có phim nào isHot): không có thiết kế placeholder riêng
  // cho Hero — ẩn khối, tránh render HeroBanner với chuỗi rỗng cho title/imageSrc (props bắt buộc).
  if (!film) {
    return null;
  }

  return (
    <HeroBanner
      title={film.title}
      badge="Nổi Bật"
      meta={toMeta(film)}
      description=""
      imageSrc={film.posterUrl ?? film.thumbUrl ?? ''}
      slug={film.slug}
    />
  );
}
