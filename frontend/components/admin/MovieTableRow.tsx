import Link from 'next/link';
import type { FilmSummary } from '@/lib/types/film';
import { FILM_FORMAT_LABELS, FILM_STATUS_LABELS, formatFilmDate } from '@/lib/utils/film-labels';
import { MoviePosterThumb } from './MoviePosterThumb';

/** Một dòng bảng Admin Movie List (Phase 19B.1) — khớp thứ tự cột yêu cầu: Poster, Tên phim, Loại
 * phim, Trạng thái, Năm, Quốc gia, Thể loại, Rating, Lượt xem, Ngày tạo.
 *
 * Phase 19B.2: thêm cột "Thao tác" (Sửa/Xoá). Nút "Sửa" cho phim ẨN (`isPublished:false`) bị vô
 * hiệu hoá kèm chú thích — `GET /films/:slug` (endpoint duy nhất trả đủ dữ liệu điền form) hardcode
 * lọc `isPublished:true`, không có nhánh admin bypass (audit Phase 19B.2), nên trang Sửa chắc chắn
 * 404 với phim ẩn. Vô hiệu hoá tại đây thay vì để người dùng bấm vào rồi gặp lỗi. */
export function MovieTableRow({
  film,
  onDeleteClick,
}: {
  film: FilmSummary;
  onDeleteClick: () => void;
}) {
  return (
    <tr className="hover:bg-white/5 transition-colors duration-200 ease-out">
      <td className="px-md py-sm">
        <MoviePosterThumb src={film.posterUrl ?? film.thumbUrl} alt={film.title} />
      </td>
      <td className="px-md py-sm max-w-[240px]">
        <p className="font-bold text-on-surface line-clamp-2">{film.title}</p>
        {film.originalTitle ? (
          <p className="text-label-md text-on-surface-variant line-clamp-1">{film.originalTitle}</p>
        ) : null}
      </td>
      <td className="px-md py-sm whitespace-nowrap text-on-surface-variant">
        {FILM_FORMAT_LABELS[film.category] ?? film.category}
      </td>
      <td className="px-md py-sm whitespace-nowrap text-on-surface-variant">
        {FILM_STATUS_LABELS[film.status] ?? film.status}
      </td>
      <td className="px-md py-sm whitespace-nowrap text-on-surface-variant">
        {film.releaseYear ?? '—'}
      </td>
      <td className="px-md py-sm max-w-[160px] text-on-surface-variant">
        {film.countries.length > 0 ? film.countries.map((country) => country.name).join(', ') : '—'}
      </td>
      <td className="px-md py-sm max-w-[200px] text-on-surface-variant">
        {film.categories.length > 0
          ? film.categories.map((category) => category.name).join(', ')
          : '—'}
      </td>
      <td className="px-md py-sm whitespace-nowrap text-on-surface-variant">
        {film.ratingCount > 0 ? film.ratingAvg.toFixed(1) : '—'}
      </td>
      <td className="px-md py-sm whitespace-nowrap text-on-surface-variant">
        {film.view.toLocaleString('vi-VN')}
      </td>
      <td className="px-md py-sm whitespace-nowrap text-on-surface-variant">
        {formatFilmDate(film.createdAt)}
      </td>
      <td className="px-md py-sm whitespace-nowrap">
        <div className="flex items-center gap-sm">
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
      </td>
    </tr>
  );
}
