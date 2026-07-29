import type { Metadata } from 'next';
import { CreateUserView } from '@/components/admin/CreateUserView';

export const metadata: Metadata = {
  title: 'Tạo người dùng mới',
};

export default function CreateUserPage() {
  return <CreateUserView />;
}
