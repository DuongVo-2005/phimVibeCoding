import type { Metadata } from 'next';
import { AdminMovieListView } from '@/components/admin/AdminMovieListView';

export const metadata: Metadata = {
  title: 'Quản lý phim',
};

export default function AdminMoviesPage() {
  return <AdminMovieListView />;
}
