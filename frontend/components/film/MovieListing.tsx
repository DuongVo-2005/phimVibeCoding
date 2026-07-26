'use client';

import { useQuery } from '@tanstack/react-query';
import { FilterSidebar } from '@/components/film/FilterSidebar';
import { MovieCard } from '@/components/film/MovieCard';
import { MovieCardSkeleton } from '@/components/film/MovieCardSkeleton';
import { Badge } from '@/components/ui/Badge';
import { Container } from '@/components/layout/Container';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Pagination } from '@/components/ui/Pagination';
import { useMovieSearch } from '@/hooks/useMovieSearch';
import { filmsQueryOptions } from '@/lib/query/options';
import { countryOptions, genreChips, sortOptions } from '@/app/(public)/_mock/moviecategory-data';

const GRID_LIMIT = 12;

export interface MovieListingFilter {
  format?: 'single' | 'series';
  category?: string;
  country?: string;
  search?: string;
}

/**
 * MovieListing — nội dung trang danh sách phim, khớp design/moviecategory.html. Dùng chung cho
 * 5 route /phim-le, /phim-bo, /the-loai/[slug], /quoc-gia/[slug], /tim-kiem (chỉ khác `title`/
 * `description`/`filter` truyền vào) — tránh lặp lại cấu trúc trang nhiều lần.
 *
 * Phase 16A: nối API thật qua `filmsQueryOptions.list({...filter, limit})` — thay hoàn toàn
 * `movieGrid` mock (`_mock/moviecategory-data.ts` chỉ còn giữ `genreChips`/`countryOptions`/
 * `sortOptions` cho `FilterSidebar`, thành phần đó vẫn tĩnh, KHÔNG thuộc phạm vi phase này — quyết
 * định giữ nguyên để tối thiểu thay đổi). `format`/`category`/`country`/`search` khớp đúng
 * `QueryFilmDto` thật (backend). Ô tìm kiếm tại chỗ dùng chung `useMovieSearch()` với Header —
 * submit sẽ điều hướng sang `/tim-kiem?q=...` (không tự lọc tại chỗ, tránh 2 nguồn sự thật cho
 * cùng 1 khái niệm "đang tìm gì").
 *
 * Loading/Empty/Error (Phase 16C): skeleton khớp đúng số card (`GRID_LIMIT`) + đúng khung hình
 * `MovieCard` thật, không animation (đúng pattern `ContinueWatchingSection`/`TopRatedSection`).
 * Empty dùng `EmptyState` dùng chung ("Không tìm thấy phim." / "Hãy thử từ khóa khác." — nhóm B
 * trong audit, khác `ContinueWatchingSection` nhóm A luôn ẩn khối). Error có nút "Thử lại" gọi
 * `refetch()` thật, không chỉ hiện message suông.
 *
 * `filter.search === ''` (vào `/tim-kiem` chưa nhập `q`) là 1 trạng thái riêng — KHÔNG gọi API
 * (query rỗng gửi lên backend dễ hiểu sai ý), hiện thẳng lời nhắc nhập từ khóa.
 */
export function MovieListing({
  title,
  description,
  filter,
}: {
  title: string;
  description: string;
  filter?: MovieListingFilter;
}) {
  const isEmptySearch = filter?.search !== undefined && filter.search.trim().length === 0;

  const { data, isLoading, isError, refetch } = useQuery({
    ...filmsQueryOptions.list({ ...filter, limit: GRID_LIMIT }),
    enabled: !isEmptySearch,
  });
  const { value, setValue, handleSubmit } = useMovieSearch(filter?.search ?? '');
  const films = data?.items ?? [];

  return (
    // Padding dưới cho fixed bottom nav/header đã xử lý chung ở MainLayout (Phase 10.1) — không
    // lặp lại ở đây.
    <Container className="flex gap-lg">
      <FilterSidebar genres={genreChips} countries={countryOptions} sorts={sortOptions} />

      <section className="flex-1">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-md mb-lg">
          <div>
            <h1 className="text-display-lg font-display-lg text-on-surface tracking-tight mb-xs">
              {title}
            </h1>
            <p className="text-body-lg text-on-surface-variant max-w-2xl">{description}</p>
          </div>
          <form role="search" onSubmit={handleSubmit} className="relative w-full md:w-96">
            <span
              className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-on-surface-variant"
              aria-hidden="true"
            >
              search
            </span>
            <input
              type="search"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder="Tìm kiếm phim, diễn viên..."
              aria-label="Tìm kiếm phim, diễn viên"
              className="w-full bg-surface-container border-none py-md pl-14 pr-md rounded-full text-body-md shadow-lg placeholder:text-on-surface-variant/50 focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </form>
        </div>

        {isEmptySearch ? (
          <EmptyState message="Nhập từ khóa để tìm phim." icon="search" />
        ) : isError ? (
          <ErrorState message="Không tải được danh sách phim." onRetry={() => refetch()} />
        ) : isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-md pb-xl">
            {Array.from({ length: GRID_LIMIT }).map((_, index) => (
              <MovieCardSkeleton key={index} />
            ))}
          </div>
        ) : films.length === 0 ? (
          <EmptyState message="Không tìm thấy phim." subtitle="Hãy thử từ khóa khác." />
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-md pb-xl">
              {films.map((film) => (
                <MovieCard
                  key={film._id}
                  title={film.title}
                  href={`/phim/${film.slug}`}
                  imageSrc={film.posterUrl ?? film.thumbUrl}
                  sizes="(max-width: 768px) 45vw, (max-width: 1280px) 30vw, (max-width: 1536px) 20vw, 16vw"
                  rating={film.ratingCount > 0 ? film.ratingAvg.toFixed(1) : undefined}
                  genreLine={film.categories.map((category) => category.name).join(', ')}
                  showActions
                  cornerBadge={
                    film.quality ? (
                      <Badge variant="primary" className="border-none">
                        {film.quality}
                      </Badge>
                    ) : undefined
                  }
                />
              ))}
            </div>

            {data && data.meta.totalPages > 1 ? (
              <Pagination
                currentPage={data.meta.page}
                pages={[data.meta.page]}
                lastPage={data.meta.totalPages}
              />
            ) : null}
          </>
        )}
      </section>
    </Container>
  );
}
