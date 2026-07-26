/**
 * Dữ liệu mock cho `FilterSidebar` (sidebar bộ lọc) trong `design/moviecategory.html` — sidebar
 * này vẫn tĩnh, không thuộc phạm vi Phase 16A (chỉ nối API thật cho phần grid phim, xem
 * `MovieListing.tsx`). `movieGrid`/`pagination` (mock lưới phim) đã bị xoá ở Phase 16A — `MovieListing`
 * giờ lấy dữ liệu thật qua `filmsQueryOptions.list()`.
 */

export const genreChips = [
  { id: 'hanh-dong', label: 'Hành Động', active: true },
  { id: 'kinh-di', label: 'Kinh Dị', active: false },
  { id: 'tinh-cam', label: 'Tình Cảm', active: false },
  { id: 'vien-tuong', label: 'Viễn Tưởng', active: false },
  { id: 'hoat-hinh', label: 'Hoạt Hình', active: false },
  { id: 'hai-huoc', label: 'Hài Hước', active: false },
];

export const countryOptions = ['Tất cả quốc gia', 'Hoa Kỳ', 'Hàn Quốc', 'Nhật Bản', 'Việt Nam'];

export const sortOptions = [
  { id: 'newest', label: 'Mới nhất', active: true },
  { id: 'most-viewed', label: 'Xem nhiều nhất', active: false },
  { id: 'top-rated', label: 'Đánh giá cao nhất', active: false },
];
