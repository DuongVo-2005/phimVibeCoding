import type { Metadata } from 'next';
import { CreateCategoryView } from '@/components/admin/CreateCategoryView';

export const metadata: Metadata = {
  title: 'Tạo thể loại mới',
};

export default function CreateCategoryPage() {
  return <CreateCategoryView />;
}
