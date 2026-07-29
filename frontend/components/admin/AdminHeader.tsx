'use client';

import { useSession } from 'next-auth/react';
import { Badge } from '@/components/ui/Badge';
import { logoutUser } from '@/lib/auth/logout';

/**
 * AdminHeader — thanh trên cùng khu vực admin: tên/email user hiện tại + badge role + nút đăng
 * xuất. Không có search/notification — chưa có tính năng nào cần (đúng phạm vi "nền tảng, không
 * CRUD"). `logoutUser()` tái dùng NGUYÊN hàm đã có ở `lib/auth/logout.ts` (dùng cho
 * `AccountSidebar`), không viết lại logic đăng xuất riêng cho admin.
 */
export function AdminHeader() {
  const { data: session } = useSession();
  const accessToken = session?.accessToken;

  const handleLogout = () => {
    void logoutUser(accessToken);
  };

  return (
    <header className="flex items-center justify-between gap-md border-b border-white/10 bg-surface-container/60 px-gutter py-sm">
      <div className="flex items-center gap-sm min-w-0">
        <span className="material-symbols-outlined text-on-surface-variant" aria-hidden="true">
          person
        </span>
        <div className="flex flex-col min-w-0">
          <span className="text-label-md font-bold text-on-surface truncate">
            {session?.user?.name || session?.user?.email || ''}
          </span>
          {session?.user?.role ? (
            <Badge variant="primary" className="w-fit uppercase">
              {session.user.role}
            </Badge>
          ) : null}
        </div>
      </div>
      <button
        type="button"
        onClick={handleLogout}
        aria-label="Đăng xuất"
        className="flex items-center gap-xs px-md py-xs rounded-lg bg-surface-container-highest text-error hover:bg-error/10 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
      >
        <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
          logout
        </span>
        <span className="text-label-md font-label-md hidden sm:inline">Đăng xuất</span>
      </button>
    </header>
  );
}
