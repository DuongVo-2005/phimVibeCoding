import type { Metadata } from 'next';
import { MovieListing } from '@/components/film/MovieListing';

/**
 * Route tìm kiếm — Phase 16A. Đọc `?q=` từ URL, tái sử dụng `MovieListing` (không tự viết logic
 * fetch/filter riêng — đúng yêu cầu "Không duplicate logic"). Ô tìm kiếm ở `Header`/`MovieListing`
 * đều điều hướng tới đây qua `useMovieSearch()` (`hooks/useMovieSearch.ts`).
 */
// Phase 18: xem ghi chú `app/(public)/phim-le/page.tsx`. `searchParams` là Promise theo Next.js 16
// (giống `page.tsx` dưới) — `generateMetadata` nhận state riêng, không dùng chung biến với page.
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}): Promise<Metadata> {
  const { q } = await searchParams;
  const query = q?.trim() ?? '';
  return {
    title: query ? `Tìm kiếm: ${query}` : 'Tìm kiếm',
    description: query
      ? `Kết quả tìm kiếm cho "${query}"`
      : 'Tìm kiếm phim, diễn viên yêu thích của bạn.',
  };
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? '';

  return (
    <MovieListing
      title="Tìm kiếm"
      description={
        query ? `Kết quả tìm kiếm cho "${query}"` : 'Tìm kiếm phim, diễn viên yêu thích của bạn.'
      }
      filter={{ search: query }}
    />
  );
}
