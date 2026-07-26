import type { Metadata } from 'next';
import { MovieListing } from '@/components/film/MovieListing';

// Phase 18: xem ghi chú `app/(public)/phim-le/page.tsx`.
export const metadata: Metadata = {
  title: 'Phim Bộ',
  description: 'Những bộ phim truyền hình nhiều tập đang được yêu thích nhất.',
};

export default function PhimBoPage() {
  return (
    <MovieListing
      title="Phim Bộ"
      description="Những bộ phim truyền hình nhiều tập đang được yêu thích nhất."
      filter={{ format: 'series' }}
    />
  );
}
