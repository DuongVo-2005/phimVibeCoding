import { Container } from '@/components/layout/Container';
import { AccountSidebar } from '@/components/account/AccountSidebar';
import { FavoriteListItem } from '@/components/account/FavoriteListItem';
import { HistoryCard } from '@/components/account/HistoryCard';
import { ProfileHero } from '@/components/account/ProfileHero';
import { WatchlistThumb } from '@/components/account/WatchlistThumb';
import {
  favorites,
  userProfile,
  watchHistory,
  watchlist,
} from '@/app/(account)/_mock/user-dashboard-data';

/**
 * UserDashboardView — nội dung trang quản lý tài khoản, khớp `design/userdasboard.html`. Route
 * `/user/profile` chỉ có 1 nội dung mock cố định (không suy diễn theo user thật — KHÔNG gọi API,
 * không state, đúng phạm vi đã xác nhận Phase 10.8).
 *
 * Quyết định A: layout Header/Footer do `app/(account)/layout.tsx` cung cấp qua `MainLayout`,
 * component này chỉ chứa nội dung canvas (sidebar + main content), không tự dựng Header/Footer.
 *
 * Quyết định B: "Xem tiếp" dùng `HistoryCard` (component mới) — chỉ hiện ở desktop (`hidden
 * md:block`), design mobile không có mục này (chỉ có số liệu tổng trong Stats Row).
 *
 * Quyết định D: "Danh sách xem" dùng `WatchlistThumb` với 1 mô hình dữ liệu duy nhất — ô "Thêm
 * mới" là UI tĩnh không gắn dữ liệu, hiện ở mọi kích thước.
 *
 * Quyết định E: nút "Thoát"/"Đăng xuất" hoàn toàn trang trí, không `onClick`, không `signOut()`.
 *
 * "Subscription & Settings" (mobile) là bản thay thế của 2 mục cùng tên trong `AccountSidebar`
 * (desktop) — sidebar ẩn ở mobile (`hidden md:flex`), section này ẩn ở desktop (`md:hidden`).
 */
export function UserDashboardView() {
  return (
    <Container maxWidth="max-w-screen-2xl" className="py-lg flex flex-col md:flex-row gap-lg">
      <AccountSidebar
        name={userProfile.name}
        email={userProfile.email}
        avatarSrc={userProfile.avatarSrc}
      />

      <div className="flex-1 flex flex-col gap-xl">
        <ProfileHero
          name={userProfile.name}
          premiumLabel={userProfile.premiumLabel}
          memberSinceLabel={userProfile.memberSinceLabel}
          moviesWatchedLabel={userProfile.moviesWatchedLabel}
          pointsLabel={userProfile.pointsLabel}
          avatarSrc={userProfile.avatarSrc}
          bannerSrc={userProfile.bannerSrc}
        />

        {/* Stats row — chỉ mobile, khớp Stats Row trong design (desktop không có, vì đã có số liệu trong ProfileHero) */}
        <div className="md:hidden grid grid-cols-2 gap-4">
          <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center text-center">
            <span className="text-headline-md font-bold text-primary">
              {userProfile.favoritesCountLabel}
            </span>
            <span className="text-on-surface-variant font-label-md">Favorites</span>
          </div>
          <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center text-center">
            <span className="text-headline-md font-bold text-secondary">
              {userProfile.watchHistoryCountLabel}
            </span>
            <span className="text-on-surface-variant font-label-md">Watch History</span>
          </div>
        </div>

        {/* Xem tiếp — chỉ desktop */}
        <section className="hidden md:block">
          <div className="flex justify-between items-center mb-md">
            <h2 className="text-headline-md font-bold text-on-surface flex items-center gap-sm">
              <span className="material-symbols-outlined text-primary" aria-hidden="true">
                history
              </span>
              Xem tiếp
            </h2>
            <button type="button" className="text-primary hover:underline text-label-md">
              Xem tất cả
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-md">
            {watchHistory.map((item) => (
              <HistoryCard
                key={item.id}
                title={item.title}
                badge={item.badge}
                rating={item.rating}
                progressPercent={item.progressPercent}
                imageSrc={item.imageSrc}
              />
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg">
          <section className="bg-surface-container rounded-xl p-md shadow-lg flex flex-col gap-md">
            <div className="flex justify-between items-center">
              <h2 className="text-headline-md font-bold text-on-surface flex items-center gap-sm">
                <span
                  className="material-symbols-outlined text-error"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                  aria-hidden="true"
                >
                  favorite
                </span>
                Yêu thích
              </h2>
              <button
                type="button"
                className="text-on-surface-variant hover:text-on-surface material-symbols-outlined"
              >
                more_horiz
              </button>
            </div>
            <div className="flex gap-4 overflow-x-auto md:flex-col md:gap-sm md:overflow-visible">
              {favorites.map((item) => (
                <FavoriteListItem
                  key={item.id}
                  title={item.title}
                  genre={item.genre}
                  year={item.year}
                  imageSrc={item.imageSrc}
                />
              ))}
            </div>
          </section>

          <section className="bg-surface-container rounded-xl p-md shadow-lg flex flex-col gap-md">
            <div className="flex justify-between items-center">
              <h2 className="text-headline-md font-bold text-on-surface flex items-center gap-sm">
                <span
                  className="material-symbols-outlined text-secondary-container"
                  aria-hidden="true"
                >
                  bookmark
                </span>
                Danh sách xem
              </h2>
              <button
                type="button"
                className="text-on-surface-variant hover:text-on-surface material-symbols-outlined"
              >
                grid_view
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-sm">
              {watchlist.map((item) => (
                <WatchlistThumb
                  key={item.id}
                  title={item.title}
                  imageSrc={item.imageSrc}
                  progressPercent={item.progressPercent}
                  remainingLabel={item.remainingLabel}
                />
              ))}
              <div className="aspect-[2/3] rounded-lg border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-xs text-on-surface-variant">
                <span className="material-symbols-outlined" aria-hidden="true">
                  add
                </span>
                <span className="text-label-md">Thêm mới</span>
              </div>
            </div>
          </section>
        </div>

        {/* Subscription & Settings — chỉ mobile, thay thế cho AccountSidebar (chỉ desktop) */}
        <section className="md:hidden flex flex-col gap-3 pb-8">
          <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-xl p-4 flex items-center justify-between border-l-4 border-l-primary">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary" aria-hidden="true">
                  card_membership
                </span>
              </div>
              <div>
                <p className="font-label-md text-on-surface">Gói Thuê Bao</p>
                <p className="text-[12px] text-on-surface-variant">Hết hạn sau 15 ngày</p>
              </div>
            </div>
            <span className="material-symbols-outlined text-on-surface-variant" aria-hidden="true">
              chevron_right
            </span>
          </div>
          <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden">
            <div className="p-4 flex items-center justify-between border-b border-white/5">
              <div className="flex items-center gap-4">
                <span
                  className="material-symbols-outlined text-on-surface-variant"
                  aria-hidden="true"
                >
                  settings
                </span>
                <span className="font-label-md text-on-surface">Cài đặt ứng dụng</span>
              </div>
              <span
                className="material-symbols-outlined text-on-surface-variant text-[20px]"
                aria-hidden="true"
              >
                chevron_right
              </span>
            </div>
            <div className="p-4 flex items-center justify-between border-b border-white/5">
              <div className="flex items-center gap-4">
                <span
                  className="material-symbols-outlined text-on-surface-variant"
                  aria-hidden="true"
                >
                  help
                </span>
                <span className="font-label-md text-on-surface">Trung tâm hỗ trợ</span>
              </div>
              <span
                className="material-symbols-outlined text-on-surface-variant text-[20px]"
                aria-hidden="true"
              >
                chevron_right
              </span>
            </div>
            <button type="button" className="w-full p-4 flex items-center gap-4 text-error">
              <span className="material-symbols-outlined" aria-hidden="true">
                logout
              </span>
              <span className="font-label-md">Đăng xuất</span>
            </button>
          </div>
        </section>
      </div>
    </Container>
  );
}
