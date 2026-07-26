import type { Metadata } from 'next';
import { MovieListing } from '@/components/film/MovieListing';

// Phase 18: metadata riêng (audit phát hiện MỌI route public trước đây đều dùng chung
// `<title>RoPhim</title>` từ root layout — trùng lặp title toàn site). Dùng lại đúng chuỗi đã hiện
// trên `<h1>`/mô tả JSX bên dưới, không bịa nội dung mới.
export const metadata: Metadata = {
  title: 'Phim Lẻ',
  description: 'Những bộ phim điện ảnh chọn lọc, cập nhật liên tục dành cho bạn.',
};

export default function PhimLePage() {
  return (
    <MovieListing
      title="Phim Lẻ"
      description="Những bộ phim điện ảnh chọn lọc, cập nhật liên tục dành cho bạn."
      filter={{ format: 'single' }}
    />
  );
}
