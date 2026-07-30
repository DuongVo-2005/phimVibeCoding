import type { Metadata } from 'next';
import { AdminDashboardView } from '@/components/admin/AdminDashboardView';

export const metadata: Metadata = {
  title: 'Dashboard',
};

/**
 * Phase 32 (v1.1 — Dashboard API): thay `EmptyState` tạm thời (Admin Foundation phase, chưa có
 * API) bằng `AdminDashboardView` thật — backend đã có `dashboard.controller.ts` (`GET /dashboard/
 * {overview,charts,top-lists,recent-activity}`).
 */
export default function AdminDashboardPage() {
  return <AdminDashboardView />;
}
