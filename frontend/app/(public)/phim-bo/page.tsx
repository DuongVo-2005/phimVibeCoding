import { MovieListing } from '@/components/film/MovieListing';

export default function PhimBoPage() {
  return (
    <MovieListing
      title="Phim Bộ"
      description="Những bộ phim truyền hình nhiều tập đang được yêu thích nhất."
      filter={{ format: 'series' }}
    />
  );
}
