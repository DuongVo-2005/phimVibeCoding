import Link from 'next/link';
import type { FilmSummary } from '@/lib/types/film';
import { FILM_FORMAT_LABELS, FILM_STATUS_LABELS, formatFilmDate } from '@/lib/utils/film-labels';
import { MoviePosterThumb } from './MoviePosterThumb';

/** Thẻ phim cho danh sách mobile (Phase 19B.1, yêu cầu 9 — "Mobile không cần Table đầy đủ, có thể
 * chuyển thành Card List"). Hiện cùng dữ liệu với `MovieTableRow`, chỉ khác bố cục.
 *
 * Phase 19B.2: thêm Sửa/Xoá — cùng ghi chú vô hiệu hoá "Sửa" cho phim ẩn như `MovieTableRow`. */
export function MovieListCard({
  film,
  onDeleteClick,
}: {
  film: FilmSummary;
  onDeleteClick: () => void;
}) {
  return (
    <div className="flex w-full gap-md rounded-xl border border-white/10 bg-surface-container p-md">
      <MoviePosterThumb src={film.posterUrl ?? film.thumbUrl} alt={film.title} />
      <div className="flex flex-1 flex-col gap-1 min-w-0">
        <p className="font-bold text-on-surface line-clamp-2">{film.title}</p>
        <p className="text-label-md text-on-surface-variant">
          {FILM_FORMAT_LABELS[film.category] ?? film.category} •{' '}
          {FILM_STATUS_LABELS[film.status] ?? film.status}
          {film.releaseYear ? ` • ${film.releaseYear}` : ''}
        </p>
        <p className="text-label-md text-on-surface-variant line-clamp-1">
          {film.countries.length > 0
            ? film.countries.map((country) => country.name).join(', ')
            : '—'}
        </p>
        <p className="text-label-md text-on-surface-variant line-clamp-1">
          {film.categories.length > 0
            ? film.categories.map((category) => category.name).join(', ')
            : '—'}
        </p>
        <div className="flex flex-wrap items-center gap-x-md gap-y-1 text-label-md text-on-surface-variant mt-1">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
              star
            </span>
            {film.ratingCount > 0 ? film.ratingAvg.toFixed(1) : '—'}
          </span>
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
              visibility
            </span>
            {film.view.toLocaleString('vi-VN')}
          </span>
          <span>{formatFilmDate(film.createdAt)}</span>
        </div>
        <div className="flex items-center gap-md mt-1">
          {film.isPublished ? (
            <Link
              href={`/admin/phim/${film.slug}`}
              className="text-primary hover:underline text-label-md font-bold"
            >
              Sửa
            </Link>
          ) : (
            <span
              className="text-on-surface-variant/50 text-label-md font-bold cursor-not-allowed"
              title="Không thể sửa phim đang ẩn (giới hạn API — xem báo cáo Phase 19B.2)"
            >
              Sửa
            </span>
          )}
          <button
            type="button"
            onClick={onDeleteClick}
            className="text-error hover:underline text-label-md font-bold"
          >
            Xoá
          </button>
        </div>
      </div>
    </div>
  );
}
