'use client';

import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/Badge';
import { Section } from '@/components/ui/Section';
import { filmsQueryOptions } from '@/lib/query/options';
import { MovieCard } from './MovieCard';

/**
 * Phase 11.5: wiring `GET /films/most-commented` cho khối "Bình Luận Sôi Nổi" — section mới
 * (backend đã chuẩn bị sẵn ý định này, xem comment `films.service.ts` quanh `findMostCommented()`).
 * Cùng pattern `TrendingSection.tsx`. Quyết định đã chốt: KHÔNG sửa `MovieCard` để thêm slot hiện
 * `commentCount` — chỉ dựa vào thứ tự sort có sẵn từ backend (`commentCount: -1`), không hiển thị
 * số bình luận trên card.
 */
export function MostCommentedSection() {
  const { data } = useQuery(filmsQueryOptions.mostCommented());
  const films = data ?? [];

  // Rỗng/loading: không có thiết kế placeholder riêng cho carousel này — ẩn khối cho tới khi có
  // dữ liệu (đúng pattern Phase 11.4, không tạo UX mới).
  if (films.length === 0) {
    return null;
  }

  return (
    <Section title="Bình Luận Sôi Nổi">
      <div className="flex overflow-x-auto gap-md pb-2">
        {films.map((film) => (
          <div key={film._id} className="min-w-[200px] lg:min-w-[240px] flex-shrink-0">
            <MovieCard
              title={film.title}
              href={`/phim/${film.slug}`}
              imageSrc={film.posterUrl ?? film.thumbUrl}
              badges={
                film.quality ? (
                  <Badge variant="primary" className="border-none">
                    {film.quality}
                  </Badge>
                ) : undefined
              }
            />
          </div>
        ))}
      </div>
    </Section>
  );
}
