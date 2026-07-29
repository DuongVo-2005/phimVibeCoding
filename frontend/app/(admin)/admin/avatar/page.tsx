import type { Metadata } from 'next';
import { AdminAvatarView } from '@/components/admin/AdminAvatarView';

export const metadata: Metadata = {
  title: 'Quản lý Avatar',
};

export default function AdminAvatarPage() {
  return <AdminAvatarView />;
}
