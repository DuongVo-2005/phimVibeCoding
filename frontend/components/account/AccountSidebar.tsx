import Image from 'next/image';

/**
 * AccountSidebar — khớp `<aside>` sidebar tài khoản trong `design/userdasboard.html`. Đây chính
 * là component mà Phase 10.6 (quyết định A) đã cố tình KHÔNG dựng ở `/dien-vien` vì thuộc về
 * trang này — không trùng lặp, giờ mới có "nhà" thật sự. Chỉ hiện ở desktop (`hidden md:flex`) —
 * mobile dùng section "Subscription & Settings" riêng trong `UserDashboardView`.
 *
 * "Tài khoản" là mục active tĩnh (route hiện tại), không phải `<a>` — các mục khác không có route
 * thật tương ứng (Yêu thích/Danh sách/Xem tiếp/Thông báo/Subscription/Settings không nằm trong 7
 * trang design đã xác nhận) nên giữ `href="#"`, cùng quy ước placeholder-link đã dùng ở
 * `Navigation.tsx`. Nút "Thoát" chỉ trang trí — quyết định E (Phase 10.8): không `onClick`, không
 * gọi `signOut()`.
 */
export function AccountSidebar({
  name,
  email,
  avatarSrc,
}: {
  name: string;
  email: string;
  avatarSrc: string;
}) {
  return (
    <aside className="hidden md:flex md:sticky md:top-28 h-fit w-64 flex-col gap-sm shrink-0">
      <div className="bg-surface-container rounded-xl p-md shadow-lg flex flex-col gap-md">
        <div className="flex items-center gap-sm p-xs">
          <div className="relative h-12 w-12 rounded-xl overflow-hidden shrink-0 ring-2 ring-primary/20">
            <Image src={avatarSrc} alt={name} fill sizes="48px" className="object-cover" />
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-body-md font-bold text-on-surface truncate">{name}</span>
            <span className="text-label-md text-on-surface-variant truncate">{email}</span>
          </div>
        </div>

        <div className="h-px bg-white/5 mx-2" />

        <nav className="flex flex-col gap-xs" aria-label="Điều hướng tài khoản">
          <a
            href="#"
            className="flex items-center gap-sm px-sm py-xs text-on-surface-variant hover:text-on-surface hover:bg-white/5 transition-all duration-200 rounded-lg"
          >
            <span className="material-symbols-outlined" aria-hidden="true">
              favorite
            </span>
            <span className="text-label-md font-label-md">Yêu thích</span>
          </a>
          <span className="flex items-center gap-sm px-sm py-xs bg-primary/10 text-primary border-r-4 border-primary">
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
          <a
            href="#"
            className="flex items-center gap-sm px-sm py-xs text-on-surface-variant hover:text-on-surface hover:bg-white/5 transition-all duration-200 rounded-lg"
          >
            <span className="material-symbols-outlined" aria-hidden="true">
              history
            </span>
            <span className="text-label-md font-label-md">Xem tiếp</span>
          </a>
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
          <a
            href="#"
            className="flex items-center gap-sm px-sm py-xs text-on-surface-variant hover:text-on-surface hover:bg-white/5 transition-all duration-200 rounded-lg"
          >
            <span className="material-symbols-outlined" aria-hidden="true">
              settings
            </span>
            <span className="text-label-md font-label-md">Settings</span>
          </a>
        </nav>

        <button
          type="button"
          className="mt-md w-full py-sm bg-surface-container-highest text-error rounded-xl font-label-md hover:bg-error/10 transition-colors"
        >
          Thoát
        </button>
      </div>
    </aside>
  );
}
