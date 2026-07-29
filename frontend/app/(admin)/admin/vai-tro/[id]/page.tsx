import type { Metadata } from 'next';
import { EditRoleView } from '@/components/admin/EditRoleView';

export const metadata: Metadata = {
  title: 'Sửa role',
};

export default async function EditRolePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EditRoleView id={id} />;
}
