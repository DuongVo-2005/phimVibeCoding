import type { Metadata } from 'next';
import { EditMovieView } from '@/components/admin/EditMovieView';

export const metadata: Metadata = {
  title: 'Sửa phim',
};

export default async function EditMoviePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <EditMovieView slug={slug} />;
}
