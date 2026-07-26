import { MovieListing } from '@/components/film/MovieListing';

/**
 * Route động — chỉ dùng `slug` để hiển thị tiêu đề (format chuỗi thuần, không gọi API tra cứu
 * tên quốc gia thật). Cùng pattern `the-loai/[slug]/page.tsx` (Phase 16A) — tái sử dụng
 * `MovieListing`, không tự viết logic lấy dữ liệu riêng.
 */
function formatCountryTitle(slug: string): string {
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default async function CountryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const countryTitle = formatCountryTitle(slug);

  return (
    <MovieListing
      title={`Quốc Gia: ${countryTitle}`}
      description={`Danh sách phim đến từ ${countryTitle} được chọn lọc cho bạn.`}
      filter={{ country: slug }}
    />
  );
}
