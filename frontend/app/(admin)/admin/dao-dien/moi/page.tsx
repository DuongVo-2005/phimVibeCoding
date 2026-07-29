import type { Metadata } from 'next';
import { CreateDirectorView } from '@/components/admin/CreateDirectorView';

export const metadata: Metadata = {
  title: 'Tạo đạo diễn mới',
};

export default function CreateDirectorPage() {
  return <CreateDirectorView />;
}
