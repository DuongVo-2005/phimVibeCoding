import type { Metadata } from 'next';
import { EditCountryView } from '@/components/admin/EditCountryView';

export const metadata: Metadata = {
  title: 'Sửa quốc gia',
};

export default async function EditCountryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <EditCountryView slug={slug} />;
}
