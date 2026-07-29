import type { Metadata } from 'next';
import { CreateMovieView } from '@/components/admin/CreateMovieView';

export const metadata: Metadata = {
  title: 'Tạo phim mới',
};

export default function CreateMoviePage() {
  return <CreateMovieView />;
}
