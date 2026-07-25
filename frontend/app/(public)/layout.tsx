import type { ReactNode } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';

/**
 * Layout cho route group (public) đã tồn tại từ Phase 8.1 — không tạo route mới, chỉ áp
 * MainLayout (Header/Footer chung) cho các trang public đã có sẵn.
 */
export default function PublicLayout({ children }: { children: ReactNode }) {
  return <MainLayout>{children}</MainLayout>;
}
