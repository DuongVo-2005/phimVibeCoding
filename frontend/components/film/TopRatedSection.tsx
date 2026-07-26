'use client';

import { useQuery } from '@tanstack/react-query';
import { ErrorState } from '@/components/ui/ErrorState';
import { filmsQueryOptions } from '@/lib/query/options';
import { TopRatedListItem } from './TopRatedListItem';

/**
 * Phase 11.4A: wiring `GET /films/top?metric=ratingAvg` cho khối "Đánh giá cao" — thay
 * `_mock/homepage-data.ts`'s `topRated`. `score` là string trên component — format
 * `ratingAvg.toFixed(1)` (backend trả number), `TopRatedListItem` tự quyết định hiện placeholder
 * "Chưa có đánh giá" thay vì "0.0" dựa vào `ratingCount` (Phase 16A).
 *
 * Review Phase 11.4A (phát hiện B): bổ sung skeleton loading — trước đó không có, khiến list nhảy
 * từ 0 lên chiều cao thật khi data về (CLS nặng nhất trong 2 phát hiện). Skeleton dùng lại NGUYÊN
 * class layout của `TopRatedListItem` (`flex items-center gap-md ... p-base rounded-xl`, thumbnail
 * `w-16 h-20`) — chiều cao mỗi dòng do ảnh `h-20` cố định quyết định, nên khớp tuyệt đối với dòng
 * thật bất kể độ dài text. KHÔNG dùng class animation.
 *
 * Phase 16C: thêm `isError` → `ErrorState` với nút "Thử lại" gọi `refetch()` thật.
 */
export function TopRatedSection() {
  const { data, isLoading, isError, refetch } = useQuery(
    filmsQueryOptions.top({ metric: 'ratingAvg' }),
  );
  const films = data ?? [];

  return (
    <div className="lg:col-span-4 space-y-md">
      <h2 className="text-headline-lg font-headline-lg">Đánh giá cao</h2>
      {isError ? (
        <ErrorState message="Không tải được danh sách đánh giá cao." onRetry={() => refetch()} />
      ) : (
        <div className="space-y-base">
          {isLoading
            ? Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="flex items-center gap-md bg-surface-container/60 p-base rounded-xl"
                  aria-hidden="true"
                >
                  <div className="w-16 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-surface-container" />
                  <div className="flex-grow">
                    <h4 className="font-bold text-body-lg rounded bg-surface-container text-transparent w-2/3">
                      &nbsp;
                    </h4>
                    <div className="mt-1">
                      <span className="text-label-md rounded bg-surface-container text-transparent inline-block w-10">
                        &nbsp;
                      </span>
                    </div>
                  </div>
                </div>
              ))
            : films.map((film) => (
                <TopRatedListItem
                  key={film._id}
                  title={film.title}
                  score={film.ratingAvg.toFixed(1)}
                  ratingCount={film.ratingCount}
                  imageSrc={film.posterUrl ?? film.thumbUrl ?? ''}
                  slug={film.slug}
                />
              ))}
        </div>
      )}
    </div>
  );
}
