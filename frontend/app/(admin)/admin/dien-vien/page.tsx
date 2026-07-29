import type { Metadata } from 'next';
import { AdminActorListView } from '@/components/admin/AdminActorListView';

export const metadata: Metadata = {
  title: 'Quản lý diễn viên',
};

export default function AdminActorsPage() {
  return <AdminActorListView />;
}
