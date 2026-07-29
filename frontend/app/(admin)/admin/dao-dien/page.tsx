import type { Metadata } from 'next';
import { AdminDirectorListView } from '@/components/admin/AdminDirectorListView';

export const metadata: Metadata = {
  title: 'Quản lý đạo diễn',
};

export default function AdminDirectorsPage() {
  return <AdminDirectorListView />;
}
