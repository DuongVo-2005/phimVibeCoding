'use client';

import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Container } from '@/components/layout/Container';
import { AccountSidebar } from '@/components/account/AccountSidebar';
import { EmailVerificationStatus } from '@/components/account/EmailVerificationStatus';
import { FavoriteListItem } from '@/components/account/FavoriteListItem';
import { ProfileHero } from '@/components/account/ProfileHero';
import { WatchlistThumb } from '@/components/account/WatchlistThumb';
import { ContinueWatchingSection } from '@/components/film/ContinueWatchingSection';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { SkeletonBlock } from '@/components/ui/SkeletonBlock';
import { logoutUser } from '@/lib/auth/logout';
import { favoritesQueryOptions, usersQueryOptions } from '@/lib/query/options';
import type { FilmSummary } from '@/lib/types/film';
import { watchlist } from '@/app/(account)/_mock/user-dashboard-data';

const FAVORITES_PREVIEW_LIMIT = 5;
const HISTORY_PREVIEW_LIMIT = 5;

/** Khớp format mock cũ ("Tháng 1, 2024") — chỉ đổi nguồn dữ liệu (`user.createdAt` thật). */
function toMemberSinceLabel(createdAt: string): string {
  const date = new Date(createdAt);
  return `Tháng ${date.getMonth() + 1}, ${date.getFullYear()}`;
}

/**
 * UserDashboardView — nội dung trang quản lý tài khoản, khớp `design/userdasboard.html`.
 *
 * Phase 17A: `AccountSidebar`/`ProfileHero` giờ nhận dữ liệu THẬT từ `GET /users/me`
 * (`usersQueryOptions.me`) — thay hoàn toàn mock `userProfile` (đã xoá khỏi
 * `_mock/user-dashboard-data.ts`). "Danh sách xem" (watchlist) VẪN dùng mock — Watchlist thuộc
 * phase sau, ngoài phạm vi 17B.2 (xem audit Phase 17: "Do NOT implement Favorite/Rating/Comment/
 * Notification" — Watchlist tương tự chưa nằm trong phạm vi History).
 *
 * Phase 17B.1: "Yêu thích" nối API thật (`favoritesQueryOptions.mine`, `targetType:'film'`,
 * `limit:5` — chỉ xem trước, danh sách đầy đủ + phân trang + xoá ở trang riêng `/user/yeu-thich`,
 * xem `FavoriteListView.tsx`). Widget này CHỈ xem, không có nút xoá. Loading/Error/Empty riêng cho
 * đúng khối này — không chặn cả trang khi favorites đang tải/lỗi (profile vẫn hiện bình thường).
 *
 * Phase 17B.2: "Xem tiếp" tái dùng NGUYÊN `ContinueWatchingSection` thật (`limit=5`, `action=` link
 * "Xem tất cả" → `/user/lich-su` — trang quản lý đầy đủ, xem `HistoryListView.tsx`), thay
 * `HistoryCard`+mock `watchHistory` (đã xoá khỏi `_mock/user-dashboard-data.ts`). Component này tự
 * ẩn khi chưa đăng nhập/chưa có lịch sử (hành vi sẵn có, không viết logic riêng ở đây). Bọc
 * `-mx-[24px]` để triệt tiêu `px-gutter` riêng của `Section` bên trong (tránh lệch padding gấp đôi
 * so với `Container` đã bọc ngoài — xem TECH-DEBT-001 ghi chú token `--spacing-*` tuỳ biến, dùng giá
 * trị tuỳ ý thay vì tên scale để tránh phụ thuộc việc Tailwind có tự sinh utility âm cho token tên
 * riêng hay không).
 *
 * Bỏ Stats Row (favoritesCount/watchHistoryCount) — 2 con số này lấy từ mock `userProfile` cũ,
 * không có nguồn dữ liệu thật tương ứng trong `GET /users/me` (và tính đúng số thật đòi hỏi gọi
 * API Favorite/History đầy đủ — ngoài phạm vi 17A), giữ lại sẽ là số liệu bịa.
 *
 * Nút "Thoát"/"Đăng xuất" (cả desktop `AccountSidebar` lẫn mobile) giờ gọi `logoutUser()` thật
 * (Phase 17A) — trước đây hoàn toàn trang trí.
 *
 * Quyết định A: layout Header/Footer do `app/(account)/layout.tsx` cung cấp qua `MainLayout`,
 * component này chỉ chứa nội dung canvas (sidebar + main content), không tự dựng Header/Footer.
 *
 * Quyết định B: "Xem tiếp" chỉ hiện ở desktop (`hidden md:block`).
 *
 * Quyết định D: "Danh sách xem" dùng `WatchlistThumb` với 1 mô hình dữ liệu duy nhất — ô "Thêm
 * mới" là UI tĩnh không gắn dữ liệu, hiện ở mọi kích thước.
 *
 * "Subscription & Settings" (mobile) là bản thay thế của 2 mục cùng tên trong `AccountSidebar`
 * (desktop) — sidebar ẩn ở mobile (`hidden md:flex`), section này ẩn ở desktop (`md:hidden`).
 *
 * Phase 33 (v1.1 — Verify Email): thêm `EmailVerificationStatus` ngay dưới `ProfileHero` — nhận
 * thẳng `user` đã fetch ở đây (không tự query riêng), hiện trạng thái + nút Xác thực/Gửi lại theo
 * `user.isEmailVerified`.
 */
export function UserDashboardView() {
  const { data: session } = useSession();
  const accessToken = session?.accessToken;
  const { data: user, isLoading, isError, refetch } = useQuery(usersQueryOptions.me(accessToken));

  const {
    data: favoritesData,
    isLoading: isFavoritesLoading,
    isError: isFavoritesError,
    refetch: refetchFavorites,
  } = useQuery(
    favoritesQueryOptions.mine({ targetType: 'film', limit: FAVORITES_PREVIEW_LIMIT }, accessToken),
  );
  const favoriteFilms = (favoritesData?.items ?? []).filter(
    (favorite): favorite is typeof favorite & { target: FilmSummary } =>
      favorite.targetType === 'film' && favorite.target !== null,
  );

  const handleLogout = () => {
    void logoutUser(accessToken);
  };

  if (isError) {
    return (
      <Container maxWidth="max-w-screen-2xl" className="py-lg">
        <ErrorState message="Không tải được thông tin tài khoản." onRetry={() => refetch()} />
      </Container>
    );
  }

  if (isLoading || !user) {
    return (
      <Container maxWidth="max-w-screen-2xl" className="py-lg flex flex-col md:flex-row gap-lg">
        <SkeletonBlock className="hidden md:block md:sticky md:top-28 w-64 h-96 rounded-xl shrink-0" />
        <div className="flex-1 flex flex-col gap-xl">
          <SkeletonBlock className="h-48 rounded-xl" />
        </div>
      </Container>
    );
  }

  return (
    <Container maxWidth="max-w-screen-2xl" className="py-lg flex flex-col md:flex-row gap-lg">
      <AccountSidebar name={user.name} email={user.email} onLogout={handleLogout} />

      <div className="flex-1 flex flex-col gap-xl">
        <ProfileHero name={user.name} memberSinceLabel={toMemberSinceLabel(user.createdAt)} />

        <EmailVerificationStatus user={user} />

        {/* Xem tiếp — chỉ desktop */}
        <div className="hidden md:block -mx-[24px]">
          <ContinueWatchingSection
            limit={HISTORY_PREVIEW_LIMIT}
            action={
              <Link href="/user/lich-su" className="text-primary hover:underline text-label-md">
                Xem tất cả
              </Link>
            }
          />
        </div>

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
            {isFavoritesError ? (
              <ErrorState
                message="Không tải được danh sách yêu thích."
                onRetry={() => refetchFavorites()}
              />
            ) : isFavoritesLoading ? (
              <div className="flex gap-4 overflow-x-auto md:flex-col md:gap-sm md:overflow-visible">
                {Array.from({ length: 3 }).map((_, index) => (
                  <SkeletonBlock
                    key={index}
                    className="w-32 h-44 shrink-0 rounded-xl md:w-full md:h-20"
                  />
                ))}
              </div>
            ) : favoriteFilms.length === 0 ? (
              <EmptyState icon="favorite" message="Chưa có phim yêu thích." />
            ) : (
              <div className="flex gap-4 overflow-x-auto md:flex-col md:gap-sm md:overflow-visible">
                {favoriteFilms.map((favorite) => {
                  const film = favorite.target as FilmSummary;
                  return (
                    <FavoriteListItem
                      key={favorite._id}
                      title={film.title}
                      genre={film.category === 'series' ? 'Phim Bộ' : 'Phim Lẻ'}
                      year={film.releaseYear ? String(film.releaseYear) : ''}
                      imageSrc={film.posterUrl ?? film.thumbUrl ?? ''}
                      href={`/phim/${film.slug}`}
                    />
                  );
                })}
              </div>
            )}
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
            <Link
              href="/user/doi-mat-khau"
              className="p-4 flex items-center justify-between border-b border-white/5"
            >
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
            </Link>
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
            <button
              type="button"
              onClick={handleLogout}
              className="w-full p-4 flex items-center gap-4 text-error"
            >
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
