/**
 * Dữ liệu mock cho trang quản lý tài khoản (`design/userdasboard.html`) — KHÔNG gọi API.
 *
 * `userProfile` (tên/email/avatar/premium/điểm thưởng...) đã bị xoá ở Phase 17A — `AccountSidebar`/
 * `ProfileHero` giờ nhận dữ liệu THẬT từ `GET /users/me` (xem `UserDashboardView.tsx`). 3 mảng
 * dưới đây (watchHistory/favorites/watchlist) VẪN mock — xây dựng list thật cho các mục này thuộc
 * phase sau, ngoài phạm vi 17A.
 *
 * Danh sách xem (watchlist): quyết định D (Phase 10.8) — hợp nhất 1 mô hình dữ liệu duy nhất
 * (tên, ảnh, % tiến độ tuỳ chọn, thời gian còn lại tuỳ chọn), dùng chung mọi kích thước, không
 * giữ 2 bộ dữ liệu mobile/desktop riêng như design gốc (mobile có 2 mục có tiêu đề/tiến độ; desktop
 * có 5 ảnh không tiêu đề/tiến độ + ô "Thêm mới") — chỉ giữ 2 mục có đủ dữ liệu thật (tiêu đề lấy từ
 * bản mobile), không bịa tiêu đề cho các ảnh không tên của bản desktop.
 */

export interface WatchHistoryItem {
  id: string;
  title: string;
  badge: string;
  rating: string;
  progressPercent: number;
  imageSrc: string;
}

export const watchHistory: WatchHistoryItem[] = [
  {
    id: 'history-1',
    title: 'Kẻ Hủy Diệt: Kỷ Nguyên Mới',
    badge: '4K HDR',
    rating: '8.4 IMDB',
    progressPercent: 75,
    imageSrc:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDfsca6v-iV9k6L0JsUQ28m5m2yEjUykJ7KkFyMd0lygbmizg_xJJQrjqD9WqxF49JCyAhI2Yh2hqzKC43hw5nnWpt6BcZT1EMdqVOnJ5uXfMZc0YXOk5XJQYRPkdFmUehH-NfNNillC-yVeb7tgdmowN3wKZn0sxclkWq1iXaViRovSOIvDiP6QYUa8mzCLwdYhezCLU2F4ZBDMHJNz0YPIuiJhRICLt0iXb_U-4QFler0zWkE8i4_rhHP4-5em9t0nM6cGG33J3hG',
  },
  {
    id: 'history-2',
    title: 'Vương Triều Cuối Cùng',
    badge: 'HD',
    rating: '7.9 IMDB',
    progressPercent: 50,
    imageSrc:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAQ520n-ND7yT6HBZG438BiuA0y2_CQ1sW2I3mvhhzGlMbJ6qv9s7QDOWJrnhn0cAKzQXjq7h4u3dXiP0VtpOHV9RdrOM_rI47KRisoMSCj-A_PaE6I1hwfgqEj93yUsvjSlghYcWUk8sW5eaOyhM6jSvPiRbXoMR7cL6BHICcTV8OgeYan0ihlw_3mChHsHBG4HOQ_mRoUtkARSkR2YYq6Ep5n__goC4MT_WaDNE_84mzrDx9Ydd8vHV13YHz4vS6Jyb8YjWJjWFUL',
  },
  {
    id: 'history-3',
    title: 'Giai Điệu Của Đêm',
    badge: '4K',
    rating: '9.1 IMDB',
    progressPercent: 20,
    imageSrc:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAAoW1E5b6dAjxgBrSuEfGE-FstbYQ21obx1-Mppvj2FhOSJim97Bkwlw2kO46BThjzYvBa7shgzmUHuhLwt2TXdAcftq2jvYHACtsKZ2XeaQ4K1DFEwSv6yP9hNH76vdYBRGyD98WmEONSQEe5SckFnZ8q_fP9lZwMSEA0rIz_R8YHPZ3TbWdjEJd2Kz8UUB__RH3Tb_oOfyCLVgDlZ2en0W4NHzHV4X5vIq-uTAU5FE4reqY9MxJ9uB0dDREnF99JjNoPPLyzpW8k',
  },
  {
    id: 'history-4',
    title: 'Sa Mạc Rực Lửa',
    badge: 'HDR',
    rating: '8.2 IMDB',
    progressPercent: 80,
    imageSrc:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC3vnlM5WDxVFPb2n0aGbeDV4z92i00njrc38U3ga8aKt-b7knF430BcIDquet3TfZBgrsGNjQx3TXqybw4PpapbWMbIDSVNFwVy3h1MwyEGfL-TaytHW7vllyEKjVFPWQrrjKNh9eguPtZCYFAY4oPeupkshmYPOftYcVMvyjvcFA2L3LfF25cEmnMWXfOvXKR7fZtbEQM-HU4jLiMl21w4RP4Ysa9qIRCklXC70wSewbrHekWOQ2IMzT56DvIwYV5FnQ5I4_tZd8z',
  },
];

export interface FavoriteItem {
  id: string;
  title: string;
  genre: string;
  year: string;
  imageSrc: string;
}

export const favorites: FavoriteItem[] = [
  {
    id: 'fav-1',
    title: 'Bố Già (The Godfather)',
    genre: 'Drama, Crime',
    year: '1972',
    imageSrc:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDVIddx7ErX_R-QbIa4ZM2qjy9Xu-M1xoVg8w2GQC_28wpy3DJB88CogVulRi29xh-7EDUEKkGMHNeWC_ggWORnhE0nax9NQSgkVZGBChooZToae2BEP1lbUUssWt0H_9iN2UTepN8TKZqgD8BQ9cvGeQH10o5ISHKkKVlCpbMcp4b3GYeODz88SI0cJ9D7ljdTOWyffMeV-cYRNT3h-ilb6zMFG10_ybaJX0o7UJn6rh49CL7DkYlO-yOSOwPm83t3bkB57b6qPd6k',
  },
  {
    id: 'fav-2',
    title: 'Hố Đen Tử Thần (Interstellar)',
    genre: 'Sci-Fi, Adventure',
    year: '2014',
    imageSrc:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDnd_Wb85oZ4pwpV2g2Jw16X_Fotjjy-6uhnbxr6gedRh7funu8kA6xYJQhn9yG4PuuRFTy4tO8GePz0ws8GMKlnFCfzrmE6LJrFXjMf42JMKSWqm1m6uCBZMYT67Gyas_oXlGkOp9CbD3n0mLonC8XmNs2q0cVSFojuYt3t2OcYNsTDA1IX1eo09JR0jjh6A9lsb0UnnJ8L4Xslw-YKXQX0G8GVVStEH_NOXEcS_6zXT2Sfy-oejGo-pwjTKNyXp-iAfpaLavOTWGJ',
  },
  {
    id: 'fav-3',
    title: 'Kẻ Săn Tin Đen (Nightcrawler)',
    genre: 'Thriller, Crime',
    year: '2014',
    imageSrc:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuD88_SAyjt4YnAbf3rajlGONabLfdWPkqSvxabG1KtdBc4Cbi_abSbOQHPDZMO839gSItemN3T34oNEg9QDAdhB9IOe0_FfnSJEEyeHb2NTHU8geZzH46D3YaOpTXo6dTi41OBGPLZe_Nrl85IaRSePksKhtCSJwOJXHUqhuU4OL_YSXv2BYrJtZ7RQY07h6_u7u_7XE6ejrcdN4jlKZB_VvhaVPmYB4-WEc5BxfCWHqMW0a9k8nhxla8e4hvuQ0AyUtTWtXZTbPaGN',
  },
];

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
