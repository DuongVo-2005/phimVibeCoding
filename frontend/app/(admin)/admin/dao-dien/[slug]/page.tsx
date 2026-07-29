import type { Metadata } from 'next';
import { EditDirectorView } from '@/components/admin/EditDirectorView';

export const metadata: Metadata = {
  title: 'Sửa đạo diễn',
};

export default async function EditDirectorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <EditDirectorView slug={slug} />;
}
