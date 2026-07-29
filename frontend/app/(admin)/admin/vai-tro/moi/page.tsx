import type { Metadata } from 'next';
import { CreateRoleView } from '@/components/admin/CreateRoleView';

export const metadata: Metadata = {
  title: 'Tạo role mới',
};

export default function CreateRolePage() {
  return <CreateRoleView />;
}
