import type { Metadata } from 'next';
import { MovieListing } from '@/components/film/MovieListing';

/**
 * Route động — chỉ dùng `slug` để hiển thị tiêu đề (format chuỗi thuần, không gọi API tra cứu
 * tên thể loại thật — đúng phạm vi Phase 10.3: chỉ UI tĩnh, dữ liệu mock).
 */
function formatGenreTitle(slug: string): string {
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Phase 18: dùng lại ĐÚNG `formatGenreTitle` (không tính lại theo cách khác) — xem ghi chú
// `app/(public)/phim-le/page.tsx`.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const genreTitle = formatGenreTitle(slug);
  return {
    title: `Thể Loại: ${genreTitle}`,
    description: `Danh sách phim thuộc thể loại ${genreTitle} được chọn lọc cho bạn.`,
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const genreTitle = formatGenreTitle(slug);

  return (
    <MovieListing
      title={`Thể Loại: ${genreTitle}`}
      description={`Danh sách phim thuộc thể loại ${genreTitle} được chọn lọc cho bạn.`}
      filter={{ category: slug }}
    />
  );
}
