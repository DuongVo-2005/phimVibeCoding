import type { ReactNode } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import { RoleGuard } from '@/components/admin/RoleGuard';

/**
 * Layout cho route group (admin) — bọc MỌI trang dưới `/admin/**` bằng `RoleGuard` (xác thực
 * role phía client, bổ sung cho `middleware.ts` đã chặn ở tầng request) rồi mới tới `AdminShell`
 * (khung sidebar/header/breadcrumb). `RoleGuard` đứng NGOÀI `AdminShell` — chưa xác nhận admin
 * thật thì không render cả khung admin (sidebar/header cũng là thông tin nội bộ không nên lộ ra
 * dù chỉ trong khoảnh khắc chờ xác thực).
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGuard>
      <AdminShell>{children}</AdminShell>
    </RoleGuard>
  );
}
