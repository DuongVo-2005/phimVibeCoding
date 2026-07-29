import type { Metadata } from 'next';
import { AdminCategoryListView } from '@/components/admin/AdminCategoryListView';

export const metadata: Metadata = {
  title: 'Quản lý thể loại',
};

export default function AdminCategoriesPage() {
  return <AdminCategoryListView />;
}
