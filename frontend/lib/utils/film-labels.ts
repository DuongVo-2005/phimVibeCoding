/**
 * Nhãn tiếng Việt cho các enum của `Film` (`FilmCategory`/`FilmStatus` —
 * backend/src/common/constants/index.ts). Dùng chung giữa `MovieTableRow`/`MovieListCard`
 * (Phase 19B.1 — Admin Movie List), tránh lặp lại object nhãn ở cả 2 nơi.
 */
export const FILM_FORMAT_LABELS: Record<string, string> = {
  single: 'Phim lẻ',
  series: 'Phim bộ',
};

export const FILM_STATUS_LABELS: Record<string, string> = {
  ongoing: 'Đang chiếu',
  completed: 'Hoàn thành',
};

/** `createdAt`/`updatedAt` (ISO) -> "dd/mm/yyyy", dùng `Intl` sẵn có, không thêm date-fns/dayjs. */
export function formatFilmDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('vi-VN');
}
