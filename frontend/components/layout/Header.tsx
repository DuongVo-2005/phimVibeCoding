import Link from 'next/link';
import { Navigation } from './Navigation';

/**
 * Header — khớp chữ ký class `fixed top-0 w-full ... bg-surface/80 backdrop-blur-xl border-b`
 * xuất hiện nhất quán trên cả 7 trang design/*.html (Phase 10.1 audit, grep xác nhận).
 *
 * Responsive 1 cây duy nhất: dưới md chỉ hiện logo (kèm icon "movie", màu primary — đúng header
 * mobile trong design) + nút thông báo, giống hệt `homepage.html` mobile header (không có nav
 * inline/search/CTA/avatar ở mobile — các mục đó chuyển sang Navigation's bottom bar hoặc ẩn).
 *
 * Search input / nút thông báo / nút "Thành viên" / avatar: chỉ dựng UI tĩnh theo đúng thiết kế,
 * KHÔNG gắn state/onChange/onClick nào (không có auth/search logic ở Phase 10.1). Avatar dùng
 * icon "person" thay vì ảnh thật (design dùng ảnh mẫu AI-generated, không phải asset của dự án).
 *
 * Mọi icon Material Symbols thuần trang trí đều gắn `aria-hidden="true"` — icon font dùng chính
 * text content ("movie", "search"...) làm ligature, nếu không ẩn sẽ bị đọc/nhận diện nhầm thành
 * tên hiển thị (vd. accessible name của logo sẽ lẫn cả chữ "movie").
 */
export function Header() {
  return (
    <header className="fixed top-0 w-full flex justify-between items-center px-gutter py-base bg-surface/80 backdrop-blur-xl z-50 border-b border-white/10 shadow-xl h-20">
      <div className="flex items-center gap-lg">
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
        <Navigation />
      </div>

      <div className="flex items-center gap-md">
        <div className="relative hidden lg:block">
          <input
            type="text"
            placeholder="Tìm kiếm phim..."
            readOnly
            className="bg-surface-container-high border-none rounded-full py-base px-lg w-64 text-label-md focus:ring-2 focus:ring-primary/50 transition-all"
          />
          <span
            className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant"
            aria-hidden="true"
          >
            search
          </span>
        </div>
        <button
          type="button"
          className="p-2 hover:bg-white/5 rounded-full transition-all scale-95 active:scale-90"
          aria-label="Thông báo"
        >
          <span className="material-symbols-outlined text-on-surface" aria-hidden="true">
            notifications
          </span>
        </button>
        <button
          type="button"
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
