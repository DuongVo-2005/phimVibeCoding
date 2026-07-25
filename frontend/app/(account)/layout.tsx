import type { ReactNode } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';

/**
 * Layout cho route group (account) — trước Phase 10.8, group này KHÔNG có layout riêng nên
 * `/user/profile` chưa từng có Header/Footer (chỉ thừa hưởng `<html>/<body>` của root layout).
 *
 * Quyết định A (Phase 10.8): tái sử dụng nguyên `MainLayout` — component đã dùng cho `(public)`,
 * không viết lại Header/Footer riêng, không chuyển route sang `(public)`. `Header`/`Navigation`
 * đã tự đúng hành vi cho `/user/profile` (không cần sửa): `Header` không kích hoạt biến thể
 * back-button vì prefix không khớp `/phim/`/`/dien-vien/`; `Navigation` tự đánh dấu "Profile"
 * active vì `pathname.startsWith('/user')`.
 */
export default function AccountLayout({ children }: { children: ReactNode }) {
  return <MainLayout>{children}</MainLayout>;
}
