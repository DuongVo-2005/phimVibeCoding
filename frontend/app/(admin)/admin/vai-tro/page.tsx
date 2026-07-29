import type { Metadata } from 'next';
import { AdminRoleListView } from '@/components/admin/AdminRoleListView';

export const metadata: Metadata = {
  title: 'Quản lý Role & Permission',
};

export default function AdminRolesPage() {
  return <AdminRoleListView />;
}
