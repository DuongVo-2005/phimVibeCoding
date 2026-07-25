'use client';

import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/Badge';
import { Section } from '@/components/ui/Section';
import { filmsQueryOptions } from '@/lib/query/options';
import { MovieCard } from './MovieCard';

/**
 * Phase 11.4: wiring `GET /films/hot` cho khối "Đang thịnh hành" — thay
 * `_mock/homepage-data.ts`'s `trending`. Quyết định đã chốt: dùng cùng `/films/hot` như Hero
 * (React Query dedupe theo `queryKey` giống nhau — 1 request HTTP dùng chung cho cả 2 khối, không
 * gọi 2 lần). `badges` map từ `film.quality` (field đơn, không phải mảng nhãn tự do như mock cũ) —
 * chỉ hiện badge khi có `quality`. `MovieCard` (presentational) không đổi, chỉ truyền thêm `href`
 * thật (prop đã có sẵn, mặc định `'#'`) tới `/phim/:slug`.
 */
export function TrendingSection() {
  const { data } = useQuery(filmsQueryOptions.hot());
  const films = data ?? [];

  // Rỗng/loading: không có thiết kế placeholder riêng cho carousel này — ẩn khối cho tới khi có
  // dữ liệu.
  if (films.length === 0) {
    return null;
  }

  return (
    <Section title="Đang thịnh hành">
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
