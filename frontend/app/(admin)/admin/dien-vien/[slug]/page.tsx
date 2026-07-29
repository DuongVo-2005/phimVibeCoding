import type { Metadata } from 'next';
import { EditActorView } from '@/components/admin/EditActorView';

export const metadata: Metadata = {
  title: 'Sửa diễn viên',
};

export default async function EditActorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <EditActorView slug={slug} />;
}
