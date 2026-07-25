import type { ReactNode } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';

/**
 * Layout cho route group (public) đã tồn tại từ Phase 8.1 — không tạo route mới, chỉ áp
 * MainLayout (Header/Footer chung) cho các trang public đã có sẵn.
 *
 * Server Component thuần — Phase 10.4 từng đổi thành Client Component để tự dò route và truyền
 * `backHref` xuống Header, nhưng cách đó kéo cả MainLayout/Footer vào client bundle không cần
 * thiết. Đã revert: `usePathname()` chuyển hẳn vào trong `Header.tsx` (nơi thực sự cần), file này
 * và `MainLayout` quay lại đúng trạng thái Server Component như trước Phase 10.4.
 */
export default function PublicLayout({ children }: { children: ReactNode }) {
  return <MainLayout>{children}</MainLayout>;
}
