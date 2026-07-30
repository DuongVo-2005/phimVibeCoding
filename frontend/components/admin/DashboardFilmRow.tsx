import Link from 'next/link';
import type { DashboardFilmSummary } from '@/lib/types/dashboard';
import { MoviePosterThumb } from './MoviePosterThumb';

/** Dòng phim rút gọn cho các panel "Top" / "Hoạt động gần đây" của Dashboard (Phase 32) — khác
 * `MovieListCard` (có đầy đủ thể loại/quốc gia/nút Sửa-Xoá, dành cho trang danh sách quản lý phim
 * đầy đủ), ở đây chỉ cần poster + tên + 1 chỉ số phụ (view/rating/lượt thích) + link "Sửa". */
export function DashboardFilmRow({
  film,
  metricIcon,
  metricValue,
}: {
  film: DashboardFilmSummary;
  metricIcon: string;
  metricValue: string;
}) {
  return (
    <Link
      href={`/admin/phim/${film.slug}`}
      className="flex items-center gap-sm rounded-xl p-1 hover:bg-white/5 transition-colors duration-200"
    >
      <MoviePosterThumb src={film.posterUrl} alt={film.title} />
      <div className="flex-1 min-w-0">
        <p className="text-label-md font-bold text-on-surface line-clamp-2">{film.title}</p>
        <span className="flex items-center gap-1 text-label-md text-on-surface-variant">
          <span className="material-symbols-outlined text-[14px]" aria-hidden="true">
            {metricIcon}
          </span>
          {metricValue}
        </span>
      </div>
    </Link>
  );
}
