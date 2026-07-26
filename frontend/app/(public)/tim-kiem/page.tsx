import { MovieListing } from '@/components/film/MovieListing';

/**
 * Route tìm kiếm — Phase 16A. Đọc `?q=` từ URL, tái sử dụng `MovieListing` (không tự viết logic
 * fetch/filter riêng — đúng yêu cầu "Không duplicate logic"). Ô tìm kiếm ở `Header`/`MovieListing`
 * đều điều hướng tới đây qua `useMovieSearch()` (`hooks/useMovieSearch.ts`).
 */
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
