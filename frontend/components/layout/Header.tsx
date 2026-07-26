'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useNotification } from '@/hooks/useNotification';
import { useMovieSearch } from '@/hooks/useMovieSearch';
import { Navigation } from './Navigation';

const LOGIN_REQUIRED_MESSAGE = 'Bạn cần đăng nhập để sử dụng chức năng này.';

/**
 * Route nào cần biến thể "quay lại" — khớp `design/moviedentail.html` (`/phim/[slug]`). Phase
 * 10.7 (quyết định A phương án c): tái sử dụng NGUYÊN biến thể này cho `/dien-vien/[slug]`
 * (`design/actorprofile.html` cũng có nút back ở mobile header) thay vì thêm biến thể mới — chấp
 * nhận khác biệt nhỏ so với design gốc (design dùng icon "share" ở đây, biến thể có sẵn dùng
 * "search"). Chỉ thêm 1 mục vào danh sách match, không đổi cấu trúc JSX/render của Header.
 */
const BACK_BUTTON_ROUTES: Array<{ prefix: string; backHref: string }> = [
  { prefix: '/phim/', backHref: '/' },
  { prefix: '/dien-vien/', backHref: '/dien-vien' },
];

/**
 * Header — khớp chữ ký class `fixed top-0 w-full ... bg-surface/80 backdrop-blur-xl border-b`
 * xuất hiện nhất quán trên cả 7 trang design/*.html (Phase 10.1 audit, grep xác nhận).
 *
 * Responsive 1 cây duy nhất: dưới md chỉ hiện logo (kèm icon "movie", màu primary — đúng header
 * mobile trong design) + nút thông báo, giống hệt `homepage.html` mobile header (không có nav
 * inline/search/CTA/avatar ở mobile — các mục đó chuyển sang Navigation's bottom bar hoặc ẩn).
 *
 * Biến thể "quay lại" (Phase 10.4, đã kiến trúc lại): thay vì nhận prop `backHref` từ ngoài
 * (khiến `(public)/layout.tsx`/`MainLayout` phải trở thành Client Component để dò route, kéo cả
 * Footer vào client bundle không cần thiết), `Header` tự dùng `usePathname()` để quyết định —
 * đúng cách `Navigation.tsx` đã làm để biết link nào đang active. `(public)/layout.tsx` và
 * `MainLayout` giữ nguyên Server Component như trước Phase 10.4, không đổi hành vi UI.
 *
 * Avatar dùng icon "person" thay vì ảnh thật (design dùng ảnh mẫu AI-generated, không phải asset
 * của dự án).
 *
 * Phase 16A: Search input nối `useMovieSearch()` (dùng chung với `MovieListing`) — submit điều
 * hướng `/tim-kiem?q=...`, không tự lọc tại chỗ. Nút thông báo: chưa đăng nhập → `notify.info()`
 * (KHÔNG làm Notification Center — ngoài phạm vi). Nút "Thành viên": chưa đăng nhập →
 * `/dang-nhap`, đã đăng nhập → `/user/profile` (KHÔNG làm dropdown menu — ngoài phạm vi, quyết
 * định đã chốt). Icon avatar (`Link href="/user/profile"`) giữ nguyên hành vi cũ — route đã được
 * middleware bảo vệ sẵn (tự redirect `/dang-nhap` nếu chưa đăng nhập), không cần sửa.
 *
 * Mọi icon Material Symbols thuần trang trí đều gắn `aria-hidden="true"` — icon font dùng chính
 * text content ("movie", "search"...) làm ligature, nếu không ẩn sẽ bị đọc/nhận diện nhầm thành
 * tên hiển thị (vd. accessible name của logo sẽ lẫn cả chữ "movie").
 */
export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const notify = useNotification();
  const { value, setValue, handleSubmit } = useMovieSearch();
  const backHref = BACK_BUTTON_ROUTES.find((route) => pathname.startsWith(route.prefix))?.backHref;

  const handleNotificationClick = () => {
    if (!session) {
      notify.info(LOGIN_REQUIRED_MESSAGE);
    }
  };

  const handleMemberClick = () => {
    router.push(session ? '/user/profile' : '/dang-nhap');
  };

  return (
    <header className="fixed top-0 w-full flex justify-between items-center px-gutter py-base bg-surface/80 backdrop-blur-xl z-50 border-b border-white/10 shadow-xl h-20">
      <div className="flex items-center gap-lg">
        {backHref ? (
          <div className="flex items-center gap-3 md:hidden">
            <Link href={backHref} aria-label="Quay lại">
              <span
                className="material-symbols-outlined text-primary text-headline-md"
                aria-hidden="true"
              >
                arrow_back
              </span>
            </Link>
            <span className="text-headline-md font-headline-xl font-bold tracking-tighter text-primary">
              RoPhim
            </span>
          </div>
        ) : (
          <Link href="/" className="flex items-center gap-2 md:gap-0">
            <span
              className="material-symbols-outlined text-primary text-headline-md md:hidden"
              aria-hidden="true"
            >
              movie
            </span>
            <span className="text-headline-md font-headline-xl font-bold tracking-tighter text-primary md:text-on-surface md:tracking-tighter">
              RoPhim
            </span>
          </Link>
        )}
        {/* Desktop luôn hiện logo/nav chuẩn (design moviedentail.html desktop header giống hệt
            mặc định) — chỉ khác ở mobile, xử lý bằng nhánh trên. */}
        {backHref ? (
          <Link
            href="/"
            className="hidden md:flex items-center gap-0 text-headline-md font-headline-xl font-bold tracking-tighter text-on-surface"
          >
            RoPhim
          </Link>
        ) : null}
        <Navigation />
      </div>

      <div className="flex items-center gap-md">
        <form role="search" onSubmit={handleSubmit} className="relative hidden lg:block">
          <input
            type="search"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="Tìm kiếm phim..."
            aria-label="Tìm kiếm phim"
            className="bg-surface-container-high border-none rounded-full py-base px-lg w-64 text-label-md focus:ring-2 focus:ring-primary/50 transition-all"
          />
          <button
            type="submit"
            aria-label="Tìm kiếm"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant"
          >
            <span className="material-symbols-outlined" aria-hidden="true">
              search
            </span>
          </button>
        </form>
        {backHref ? (
          <Link
            href="/tim-kiem"
            aria-label="Tìm kiếm"
            className="text-on-surface-variant md:hidden"
          >
            <span className="material-symbols-outlined" aria-hidden="true">
              search
            </span>
          </Link>
        ) : null}
        <button
          type="button"
          onClick={handleNotificationClick}
          className="p-2 hover:bg-white/5 rounded-full transition-all scale-95 active:scale-90"
          aria-label="Thông báo"
        >
          <span className="material-symbols-outlined text-on-surface" aria-hidden="true">
            notifications
          </span>
        </button>
        <button
          type="button"
          onClick={handleMemberClick}
          className="hidden md:inline-flex bg-primary text-on-primary font-bold px-md py-base rounded-lg text-label-md transition-transform scale-95 active:scale-90 shadow-lg shadow-primary/20"
        >
          Thành viên
        </button>
        <Link
          href="/user/profile"
          aria-label="Tài khoản"
          className="hidden md:flex w-10 h-10 rounded-full overflow-hidden border-2 border-white/10 bg-surface-container-high items-center justify-center"
        >
          <span className="material-symbols-outlined text-on-surface-variant" aria-hidden="true">
            person
          </span>
        </Link>
      </div>
    </header>
  );
}
