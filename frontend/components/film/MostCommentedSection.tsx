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
 * Phase 11.5: wiring `GET /films/most-commented` cho khối "Bình Luận Sôi Nổi" — section mới
 * (backend đã chuẩn bị sẵn ý định này, xem comment `films.service.ts` quanh `findMostCommented()`).
 * Quyết định đã chốt: KHÔNG sửa `MovieCard` để thêm slot hiện `commentCount` — chỉ dựa vào thứ tự
 * sort có sẵn từ backend (`commentCount: -1`), không hiển thị số bình luận trên card.
 *
 * Phase 16B: `Carousel` tự build thay `flex overflow-x-auto` — xem `TrendingSection.tsx` (cùng
 * pattern). Phase 16C: skeleton + `ErrorState` (nút "Thử lại" gọi `refetch()`).
 */
export function MostCommentedSection() {
  const { data, isLoading, isError, refetch } = useQuery(filmsQueryOptions.mostCommented());
  const films = data ?? [];

  if (isError) {
    return (
      <Section title="Bình Luận Sôi Nổi">
        <ErrorState
          message="Không tải được danh sách bình luận sôi nổi."
          onRetry={() => refetch()}
        />
      </Section>
    );
  }

  if (isLoading) {
    return (
      <Section title="Bình Luận Sôi Nổi">
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

  // Rỗng/loading: không có thiết kế placeholder riêng cho carousel này — ẩn khối (nhóm A, đúng
  // pattern Phase 11.4, không tạo UX mới).
  if (films.length === 0) {
    return null;
  }

  return (
    <Section title="Bình Luận Sôi Nổi">
      <Carousel
        ariaLabel="Bình Luận Sôi Nổi"
        items={films.map((film) => ({
          key: film._id,
          content: (
            <MovieCard
              title={film.title}
              href={`/phim/${film.slug}`}
              imageSrc={film.posterUrl ?? film.thumbUrl}
              sizes="(min-width: 1024px) 240px, 200px"
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
