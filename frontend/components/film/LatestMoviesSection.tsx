'use client';

import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/Badge';
import { Section } from '@/components/ui/Section';
import { filmsQueryOptions } from '@/lib/query/options';
import { MovieCard } from './MovieCard';

/**
 * Phase 11.5: wiring "Phim Lẻ Mới" — không có route riêng ở backend (khác `latest-series`/
 * `most-commented`), dùng `GET /films` (list chung, trả `PaginatedResponse`) với
 * `format=single&sortBy=createdAt&sortOrder=desc` — đọc `data.items` (khác mảng trần của
 * `hot`/`latest-series`/`most-commented`). Không truyền `limit` riêng — dùng mặc định
 * `PaginationQueryDto` của backend, cùng cách các carousel khác ở Phase 11.4/11.5 không tự đặt
 * limit. Cùng pattern `TrendingSection.tsx` cho phần render.
 */
export function LatestMoviesSection() {
  const { data } = useQuery(
    filmsQueryOptions.list({ format: 'single', sortBy: 'createdAt', sortOrder: 'desc' }),
  );
  const films = data?.items ?? [];

  // Rỗng/loading: không có thiết kế placeholder riêng cho carousel này — ẩn khối cho tới khi có
  // dữ liệu (đúng pattern Phase 11.4, không tạo UX mới).
  if (films.length === 0) {
    return null;
  }

  return (
    <Section title="Phim Lẻ Mới">
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
