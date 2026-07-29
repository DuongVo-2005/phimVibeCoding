'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface AdminNavItem {
  href: string;
  label: string;
  icon: string;
}

/**
 * Danh sách điều hướng admin — Admin Foundation phase chỉ có 1 mục thật ("Dashboard"), KHÔNG thêm
 * sẵn link tới trang chưa tồn tại (tránh `href="#"`/link chết, đúng loại lỗi đã sửa hàng loạt ở
 * Phase 18). Phase 19B.1 thêm "Quản lý phim" — trang đích `/admin/phim` đã tồn tại thật
 * (`AdminMovieListView`). Mảng này (không phải hard-code JSX lặp) để mở rộng về sau chỉ cần thêm
 * phần tử, không phải viết lại component.
 */
const NAV_ITEMS: AdminNavItem[] = [
  { href: '/admin', label: 'Dashboard', icon: 'dashboard' },
  { href: '/admin/phim', label: 'Quản lý phim', icon: 'movie' },
  { href: '/admin/the-loai', label: 'Quản lý thể loại', icon: 'category' },
  { href: '/admin/quoc-gia', label: 'Quản lý quốc gia', icon: 'public' },
  { href: '/admin/dien-vien', label: 'Quản lý diễn viên', icon: 'person' },
  { href: '/admin/dao-dien', label: 'Quản lý đạo diễn', icon: 'movie_filter' },
  { href: '/admin/binh-luan', label: 'Kiểm duyệt bình luận', icon: 'forum' },
  { href: '/admin/nguoi-dung', label: 'Quản lý người dùng', icon: 'group' },
  { href: '/admin/vai-tro', label: 'Role & Permission', icon: 'admin_panel_settings' },
  { href: '/admin/avatar', label: 'Quản lý Avatar', icon: 'face' },
];

function isActive(pathname: string, href: string): boolean {
  return href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);
}

function NavLink({ item, active }: { item: AdminNavItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      aria-current={active ? 'page' : undefined}
      className={
        active
          ? 'flex items-center gap-sm px-sm py-xs rounded-lg bg-primary/10 text-primary whitespace-nowrap'
          : 'flex items-center gap-sm px-sm py-xs rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-white/5 transition-all duration-200 whitespace-nowrap focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary'
      }
    >
      <span className="material-symbols-outlined" aria-hidden="true">
        {item.icon}
      </span>
      <span className="text-label-md font-label-md">{item.label}</span>
    </Link>
  );
}

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop: sidebar cố định bên trái, cùng pattern sticky đã dùng ở `AccountSidebar`. */}
      <aside className="hidden lg:flex lg:sticky lg:top-0 lg:h-screen w-64 shrink-0 flex-col gap-md border-r border-white/10 bg-surface-container p-md">
        <div className="flex items-center gap-sm px-sm py-xs">
          <span className="material-symbols-outlined text-primary text-[28px]" aria-hidden="true">
            shield_person
          </span>
          <span className="text-body-lg font-bold text-on-surface">RoPhim Admin</span>
        </div>
        <div className="h-px bg-white/5" />
        <nav className="flex flex-col gap-xs" aria-label="Điều hướng quản trị">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.href} item={item} active={isActive(pathname, item.href)} />
          ))}
        </nav>
      </aside>

      {/* Mobile/tablet: thanh điều hướng NGANG dưới header, cùng breakpoint `lg` với sidebar desktop
          (2 nhánh JSX theo breakpoint — đúng kỹ thuật đã dùng ở `EpisodeList`/`ActorCard`). */}
      <nav
        className="lg:hidden flex gap-xs border-b border-white/10 bg-surface-container px-gutter py-sm overflow-x-auto"
        aria-label="Điều hướng quản trị"
      >
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.href} item={item} active={isActive(pathname, item.href)} />
        ))}
      </nav>
    </>
  );
}
