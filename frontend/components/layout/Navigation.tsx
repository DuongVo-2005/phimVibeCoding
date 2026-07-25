'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/**
 * Nav chính — đúng 6 mục trong header của design/*.html (Chủ Đề, Thể loại, Phim Lẻ, Phim Bộ,
 * Xem Chung, Quốc gia). Chỉ 3 mục có route thật đang tồn tại (Phase 8.1); "Thể loại"/"Xem Chung"/
 * "Quốc gia" chưa có route index tương ứng (chỉ có `/the-loai/[slug]` động, không có trang danh
 * sách thể loại/quốc gia) nên giữ nguyên là placeholder tĩnh (href="#"), không tự tạo route mới.
 */
const NAV_LINKS: Array<{ label: string; href: string | null }> = [
  { label: 'Chủ Đề', href: '/' },
  { label: 'Thể loại', href: null },
  { label: 'Phim Lẻ', href: '/phim-le' },
  { label: 'Phim Bộ', href: '/phim-bo' },
  { label: 'Xem Chung', href: null },
  { label: 'Quốc gia', href: null },
];

/** Bottom Navigation (mobile) — đúng 4 mục Home/Search/My List/Profile trong design/*.html. */
const BOTTOM_NAV_LINKS: Array<{ label: string; href: string | null; icon: string }> = [
  { label: 'Home', href: '/', icon: 'home' },
  { label: 'Search', href: null, icon: 'search' },
  { label: 'My List', href: null, icon: 'bookmark' },
  { label: 'Profile', href: '/user/profile', icon: 'person' },
];

function isActive(pathname: string, href: string | null): boolean {
  if (href === null) {
    return false;
  }
  return href === '/' ? pathname === '/' : pathname.startsWith(href);
}

export function Navigation() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop/tablet — nav ngang trong Header, ẩn dưới md */}
      <nav className="hidden md:flex items-center gap-md" aria-label="Điều hướng chính">
        {NAV_LINKS.map((link) =>
          link.href ? (
            <Link
              key={link.label}
              href={link.href}
              className={
                isActive(pathname, link.href)
                  ? 'text-primary font-bold text-label-md font-label-md transition-all duration-300'
                  : 'text-on-surface/70 hover:text-on-surface transition-colors text-label-md font-label-md'
              }
            >
              {link.label}
            </Link>
          ) : (
            <span
              key={link.label}
              className="text-on-surface/70 text-label-md font-label-md cursor-default"
            >
              {link.label}
            </span>
          ),
        )}
      </nav>

      {/* Mobile — bottom tab bar, ẩn từ md trở lên */}
      <nav
        className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-2 bg-surface-container/80 backdrop-blur-[40px] border-t border-white/10 rounded-t-xl shadow-xl"
        aria-label="Điều hướng dưới"
      >
        {BOTTOM_NAV_LINKS.map((link) => {
          const active = isActive(pathname, link.href);
          const className = active
            ? 'flex flex-col items-center justify-center bg-primary-container/20 text-primary rounded-xl p-2 transition-transform duration-200 active:scale-90'
            : 'flex flex-col items-center justify-center text-on-surface-variant p-2 hover:text-primary transition-colors transition-transform duration-200 active:scale-90';

          return link.href ? (
            <Link key={link.label} href={link.href} className={className}>
              <span className="material-symbols-outlined" aria-hidden="true">
                {link.icon}
              </span>
              <span className="font-label-md text-label-md">{link.label}</span>
            </Link>
          ) : (
            <span key={link.label} className={className}>
              <span className="material-symbols-outlined" aria-hidden="true">
                {link.icon}
              </span>
              <span className="font-label-md text-label-md">{link.label}</span>
            </span>
          );
        })}
      </nav>
    </>
  );
}
