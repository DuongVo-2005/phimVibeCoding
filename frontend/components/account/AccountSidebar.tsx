import Image from 'next/image';
import Link from 'next/link';

/**
 * AccountSidebar — khớp `<aside>` sidebar tài khoản trong `design/userdasboard.html`. Chỉ hiện ở
 * desktop (`hidden md:flex`) — mobile dùng section "Subscription & Settings" riêng trong
 * `UserDashboardView`.
 *
 * "Tài khoản" là mục active tĩnh (route hiện tại), không phải `<a>` — Danh sách/Thông báo/
 * Subscription vẫn `href="#"` (Watchlist/Notification ngoài phạm vi Phase 17B.2, thuộc phase sau —
 * xem audit Phase 17). "Settings" (Phase 17A) → `/user/doi-mat-khau`. "Yêu thích" (Phase 17B.1) →
 * `/user/yeu-thich`. "Xem tiếp" (Phase 17B.2) → `/user/lich-su` — trang danh sách đầy đủ
 * (`HistoryListView.tsx`), tránh để trang mới không có lối vào từ UI.
 *
 * `avatarSrc` optional — `GET /users/me` không trả URL avatar thật (xem ghi chú `ProfileHero.tsx`),
 * hiện icon "person" thay thế khi không có. Nút "Thoát": `onLogout` do `UserDashboardView` truyền
 * xuống (gọi `logoutUser()`, Phase 17A) — trước đây hoàn toàn trang trí.
 */
export function AccountSidebar({
  name,
  email,
  avatarSrc,
  onLogout,
}: {
  name: string;
  email: string;
  avatarSrc?: string;
  onLogout: () => void;
}) {
  return (
    <aside className="hidden md:flex md:sticky md:top-28 h-fit w-64 flex-col gap-sm shrink-0">
      <div className="bg-surface-container rounded-xl p-md shadow-lg flex flex-col gap-md">
        <div className="flex items-center gap-sm p-xs">
          <div className="relative h-12 w-12 rounded-xl overflow-hidden shrink-0 ring-2 ring-primary/20 bg-surface-container-high flex items-center justify-center">
            {avatarSrc ? (
              <Image src={avatarSrc} alt={name} fill sizes="48px" className="object-cover" />
            ) : (
              <span
                className="material-symbols-outlined text-on-surface-variant"
                aria-hidden="true"
              >
                person
              </span>
            )}
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-body-md font-bold text-on-surface truncate">{name}</span>
            <span className="text-label-md text-on-surface-variant truncate">{email}</span>
          </div>
        </div>

        <div className="h-px bg-white/5 mx-2" />

        <nav className="flex flex-col gap-xs" aria-label="Điều hướng tài khoản">
          <Link
            href="/user/yeu-thich"
            className="flex items-center gap-sm px-sm py-xs text-on-surface-variant hover:text-on-surface hover:bg-white/5 transition-all duration-200 rounded-lg"
          >
            <span className="material-symbols-outlined" aria-hidden="true">
              favorite
            </span>
            <span className="text-label-md font-label-md">Yêu thích</span>
          </Link>
          <span
            aria-current="page"
            className="flex items-center gap-sm px-sm py-xs bg-primary/10 text-primary border-r-4 border-primary"
          >
            <span className="material-symbols-outlined" aria-hidden="true">
              person
            </span>
            <span className="text-label-md font-label-md">Tài khoản</span>
          </span>
          <a
            href="#"
            className="flex items-center gap-sm px-sm py-xs text-on-surface-variant hover:text-on-surface hover:bg-white/5 transition-all duration-200 rounded-lg"
          >
            <span className="material-symbols-outlined" aria-hidden="true">
              bookmark
            </span>
            <span className="text-label-md font-label-md">Danh sách</span>
          </a>
          <Link
            href="/user/lich-su"
            className="flex items-center gap-sm px-sm py-xs text-on-surface-variant hover:text-on-surface hover:bg-white/5 transition-all duration-200 rounded-lg"
          >
            <span className="material-symbols-outlined" aria-hidden="true">
              history
            </span>
            <span className="text-label-md font-label-md">Xem tiếp</span>
          </Link>
          <a
            href="#"
            className="flex items-center gap-sm px-sm py-xs text-on-surface-variant hover:text-on-surface hover:bg-white/5 transition-all duration-200 rounded-lg"
          >
            <span className="material-symbols-outlined" aria-hidden="true">
              notifications
            </span>
            <span className="text-label-md font-label-md">Thông báo</span>
          </a>
        </nav>

        <div className="h-px bg-white/5 mx-2" />

        <nav className="flex flex-col gap-xs" aria-label="Cài đặt">
          <a
            href="#"
            className="flex items-center gap-sm px-sm py-xs text-on-surface-variant hover:text-on-surface hover:bg-white/5 transition-all duration-200 rounded-lg"
          >
            <span className="material-symbols-outlined" aria-hidden="true">
              card_membership
            </span>
            <span className="text-label-md font-label-md">Subscription</span>
          </a>
          <Link
            href="/user/doi-mat-khau"
            className="flex items-center gap-sm px-sm py-xs text-on-surface-variant hover:text-on-surface hover:bg-white/5 transition-all duration-200 rounded-lg"
          >
            <span className="material-symbols-outlined" aria-hidden="true">
              settings
            </span>
            <span className="text-label-md font-label-md">Settings</span>
          </Link>
        </nav>

        <button
          type="button"
          onClick={onLogout}
          className="mt-md w-full py-sm bg-surface-container-highest text-error rounded-xl font-label-md hover:bg-error/10 transition-colors"
        >
          Thoát
        </button>
      </div>
    </aside>
  );
}
