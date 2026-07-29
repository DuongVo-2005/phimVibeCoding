import type { Metadata } from 'next';
import { EditCategoryView } from '@/components/admin/EditCategoryView';

export const metadata: Metadata = {
  title: 'Sửa thể loại',
};

export default async function EditCategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <EditCategoryView slug={slug} />;
}
