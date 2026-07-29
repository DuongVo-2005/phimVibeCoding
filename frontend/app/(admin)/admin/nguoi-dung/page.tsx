import type { Metadata } from 'next';
import { AdminUserListView } from '@/components/admin/AdminUserListView';

export const metadata: Metadata = {
  title: 'Quản lý người dùng',
};

export default function AdminUsersPage() {
  return <AdminUserListView />;
}
