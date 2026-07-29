import type { Metadata } from 'next';
import { CreateCountryView } from '@/components/admin/CreateCountryView';

export const metadata: Metadata = {
  title: 'Tạo quốc gia mới',
};

export default function CreateCountryPage() {
  return <CreateCountryView />;
}
