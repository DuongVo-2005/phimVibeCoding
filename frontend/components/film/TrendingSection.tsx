'use client';

import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/Badge';
import { Carousel } from '@/components/ui/Carousel';
import { ErrorState } from '@/components/ui/ErrorState';
import { Section } from '@/components/ui/Section';
import { filmsQueryOptions } from '@/lib/query/options';
import { MovieCard } from './MovieCard';
import { MovieCardSkeleton } from './MovieCardSkeleton';

const SKELETON_COUNT = 6;

/**
 * Phase 11.4: wiring `GET /films/hot` cho khối "Đang thịnh hành" — thay
 * `_mock/homepage-data.ts`'s `trending`. Quyết định đã chốt: dùng cùng `/films/hot` như Hero
 * (React Query dedupe theo `queryKey` giống nhau — 1 request HTTP dùng chung cho cả 2 khối, không
 * gọi 2 lần). `badges` map từ `film.quality` (field đơn, không phải mảng nhãn tự do như mock cũ) —
 * chỉ hiện badge khi có `quality`. `href` thật tới `/phim/:slug` (Phase 14A trở đi).
 *
 * Phase 16B: thay `flex overflow-x-auto` (scroll ngang thuần) bằng `Carousel` tự build (auto-slide/
 * infinite/prev-next/pause-hover/swipe/keyboard/dots — xem `components/ui/Carousel.tsx`).
 *
 * Phase 16C: thêm skeleton (khớp đúng khung `MovieCard` + số lượng `SKELETON_COUNT`, không
 * animation) và `ErrorState` (nút "Thử lại" gọi `refetch()`) — trước đây `isLoading`/`isError`
 * không được đọc.
 */
export function TrendingSection() {
  const { data, isLoading, isError, refetch } = useQuery(filmsQueryOptions.hot());
  const films = data ?? [];

  if (isError) {
    return (
      <Section title="Đang thịnh hành">
        <ErrorState message="Không tải được danh sách phim thịnh hành." onRetry={() => refetch()} />
      </Section>
    );
  }

  if (isLoading) {
    return (
      <Section title="Đang thịnh hành">
        <div className="flex gap-md overflow-hidden pb-2">
          {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
            <div key={index} className="min-w-[200px] lg:min-w-[240px] flex-shrink-0">
              <MovieCardSkeleton />
            </div>
          ))}
        </div>
      </Section>
    );
  }

  // Rỗng thật (đã tải xong, backend không có phim nào isHot): không có thiết kế placeholder riêng
  // cho carousel này — ẩn khối (cùng nhóm A với "Tiếp tục xem", khác Search/MovieListing).
  if (films.length === 0) {
    return null;
  }

  return (
    <Section title="Đang thịnh hành">
      <Carousel
        ariaLabel="Đang thịnh hành"
        items={films.map((film, index) => ({
          key: film._id,
          content: (
            <MovieCard
              title={film.title}
              href={`/phim/${film.slug}`}
              imageSrc={film.posterUrl ?? film.thumbUrl}
              sizes="(min-width: 1024px) 240px, 200px"
              // Phase 18: chỉ phần tử ĐẦU (index 0) — xem ghi chú `priority` ở `MovieCard.tsx`.
              priority={index === 0}
              badges={
                film.quality ? (
                  <Badge variant="primary" className="border-none">
                    {film.quality}
                  </Badge>
                ) : undefined
              }
            />
          ),
        }))}
      />
    </Section>
  );
}
