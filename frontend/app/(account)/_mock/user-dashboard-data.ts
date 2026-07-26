/**
 * Dữ liệu mock cho trang quản lý tài khoản (`design/userdasboard.html`) — KHÔNG gọi API.
 *
 * `userProfile` (tên/email/avatar/premium/điểm thưởng...) đã bị xoá ở Phase 17A — `AccountSidebar`/
 * `ProfileHero` giờ nhận dữ liệu THẬT từ `GET /users/me`. `favorites`/`FavoriteItem` đã bị xoá ở
 * Phase 17B.1 — "Yêu thích" (cả widget dashboard lẫn trang `/user/yeu-thich`) giờ dùng
 * `favoritesQueryOptions.mine` thật (xem `UserDashboardView.tsx`, `FavoriteListView.tsx`).
 * `watchHistory` đã bị xoá ở Phase 17B.2 — "Xem tiếp" giờ tái dùng `ContinueWatchingSection` thật
 * (xem `UserDashboardView.tsx`, `HistoryListView.tsx`). `watchlist` VẪN mock — Watchlist thuộc
 * phase sau, ngoài phạm vi 17B.2.
 *
 * Danh sách xem (watchlist): quyết định D (Phase 10.8) — hợp nhất 1 mô hình dữ liệu duy nhất
 * (tên, ảnh, % tiến độ tuỳ chọn, thời gian còn lại tuỳ chọn), dùng chung mọi kích thước, không
 * giữ 2 bộ dữ liệu mobile/desktop riêng như design gốc (mobile có 2 mục có tiêu đề/tiến độ; desktop
 * có 5 ảnh không tiêu đề/tiến độ + ô "Thêm mới") — chỉ giữ 2 mục có đủ dữ liệu thật (tiêu đề lấy từ
 * bản mobile), không bịa tiêu đề cho các ảnh không tên của bản desktop.
 */

export interface WatchlistItem {
  id: string;
  title: string;
  imageSrc: string;
  progressPercent?: number;
  remainingLabel?: string;
}

export const watchlist: WatchlistItem[] = [
  {
    id: 'watchlist-1',
    title: 'Hành Trình Kỳ Diệu',
    progressPercent: 67,
    remainingLabel: 'Còn 12:45',
    imageSrc:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAo53vK2qlVYbCNptgSifq7Oyvv2u27cZzzcN2sKIt7Edg1wl1EGhasJ2A1Gz-i6iBnODD_-irVkMZVwR2OY4joSmgVxoT-LQXQzfF9ZQ878z5SjB5tySho0hMCt_RcYFbyGCFRWRDD7y9T5WLg5YhTB4cJ4VHNJCtThn6OHye4Xq2CFeGYkHvlHySrTpLcL-wGzY6T8Jqke59I_omtDea-U06YnHMT7lkJqRvT_4LGYo2UQDdW2QHL_YnwVzCLEJsO0O9l2NnrJgmI',
  },
  {
    id: 'watchlist-2',
    title: 'Mật Vụ Bóng Đêm',
    progressPercent: 25,
    remainingLabel: 'Còn 45:20',
    imageSrc:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBgjEe9l8L1ovb-9WirydApNjNw8QlivXUmPqKip50Y1wFldi4Qi98fa2s7gqkNLO-dL3jpZgjcmLofGqWcgwnLvGwq6_7fItdHKuNCV99REVSCY1AAWAyoVoOe3xxlYAWrQwiaZU8y6PSSz-f8zxos0wY9eDmysVgTYnHFMYKsMKTMzPgIn8cIwmEFiz1vw23WClWg4Bxwi6UZXdK3CEYQoCVkcs81x5DSoXq1NBlFzGquHV5gkTJKFBj0n_-x9FpSTiQoHnoO8pJY',
  },
];
