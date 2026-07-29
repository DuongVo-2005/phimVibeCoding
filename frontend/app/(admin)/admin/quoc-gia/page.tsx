import type { Metadata } from 'next';
import { AdminCountryListView } from '@/components/admin/AdminCountryListView';

export const metadata: Metadata = {
  title: 'Quản lý quốc gia',
};

export default function AdminCountriesPage() {
  return <AdminCountryListView />;
}
