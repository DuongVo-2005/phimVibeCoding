import type { ReactNode } from 'react';
import { AdminBreadcrumb } from './AdminBreadcrumb';
import { AdminHeader } from './AdminHeader';
import { AdminSidebar } from './AdminSidebar';

/**
 * AdminShell — khung layout khu vực admin: sidebar (trái, desktop) / thanh điều hướng ngang
 * (mobile, trong `AdminSidebar`) + header trên cùng + breadcrumb + nội dung trang. Component
 * THUẦN bố cục — không tự fetch dữ liệu, không tự kiểm tra quyền (đó là việc của `RoleGuard`,
 * bọc component này ở `app/(admin)/layout.tsx`, tách riêng đúng 1 trách nhiệm/component).
 *
 * Phase 19B.1 QA (Manual QA thật + đo `getBoundingClientRect` qua Playwright): `AdminSidebar` trả
 * về 2 phần tử ngang hàng qua Fragment — `<aside>` (desktop) và `<nav>` (thanh ngang mobile, Ý ĐỊNH
 * là nằm NGANG DƯỚI header). Khi wrapper này chỉ có `flex` (luôn là hàng ngang, không đổi theo
 * breakpoint), trên mobile cả 2 phần tử cùng nằm TRONG 1 hàng flex thay vì `<nav>` xếp Ở TRÊN cột
 * nội dung — `align-items:stretch` mặc định kéo `<nav>` giãn theo chiều cao toàn trang, chiếm gần
 * hết bề ngang, ép cột nội dung chỉ còn ~28px (đo được trên `/admin` VÀ `/admin/phim`, không phải
 * lỗi riêng của trang nào). `flex-col lg:flex-row` khôi phục đúng ý định gốc: xếp dọc (nav trên,
 * nội dung dưới) trên mobile, xếp ngang (sidebar trái, nội dung phải) từ `lg` trở lên — khớp đúng
 * breakpoint `hidden lg:flex`/`lg:hidden` đã dùng trong `AdminSidebar`.
 */
export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-background">
      <AdminSidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <AdminHeader />
        <AdminBreadcrumb />
        <main className="flex-1 px-gutter py-lg">{children}</main>
      </div>
    </div>
  );
}
