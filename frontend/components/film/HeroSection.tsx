'use client';

import { useQuery } from '@tanstack/react-query';
import { filmsQueryOptions } from '@/lib/query/options';
import type { FilmSummary } from '@/lib/types/film';
import { HeroBanner } from './HeroBanner';

/**
 * Phase 11.4: wiring `GET /films/hot` cho Hero Banner — thay `_mock/homepage-data.ts`'s `heroFilm`.
 * Quyết định đã chốt: lấy phần tử đầu của `/films/hot`, KHÔNG gọi thêm request lấy `description`
 * (field đó chỉ có trên `FilmDetail`, không có trên `FilmSummary` mà endpoint này trả về) — dùng
 * dữ liệu sẵn có (`''` khi không có mô tả). `HeroBanner` (presentational) không đổi.
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
  const { data } = useQuery(filmsQueryOptions.hot());
  const film = data?.[0];

  // Loading/rỗng: không có thiết kế placeholder riêng cho Hero — ẩn khối cho tới khi có dữ liệu,
  // tránh render HeroBanner với chuỗi rỗng cho title/imageSrc (props bắt buộc, không optional).
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
    />
  );
}
