import type { Metadata } from 'next';
import { CreateActorView } from '@/components/admin/CreateActorView';

export const metadata: Metadata = {
  title: 'Tạo diễn viên mới',
};

export default function CreateActorPage() {
  return <CreateActorView />;
}
