'use client';

import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/Badge';
import { Section } from '@/components/ui/Section';
import { filmsQueryOptions } from '@/lib/query/options';
import { MovieCard } from './MovieCard';

/**
 * Phase 11.5: wiring `GET /films/latest-series` cho khối "Phim Bộ Mới" — section mới, không có ở
 * `_mock/homepage-data.ts` (chưa từng có UI trước Phase 11.5, xem audit Phase 11.4/11.5). Cùng
 * pattern `TrendingSection.tsx` (Phase 11.4): carousel ngang, `MovieCard` không đổi, `badges` map
 * từ `film.quality` (chỉ hiện khi có), `href` thật tới `/phim/:slug`.
 */
export function LatestSeriesSection() {
  const { data } = useQuery(filmsQueryOptions.latestSeries());
  const films = data ?? [];

  // Rỗng/loading: không có thiết kế placeholder riêng cho carousel này — ẩn khối cho tới khi có
  // dữ liệu (đúng pattern Phase 11.4, không tạo UX mới).
  if (films.length === 0) {
    return null;
  }

  return (
    <Section title="Phim Bộ Mới">
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
