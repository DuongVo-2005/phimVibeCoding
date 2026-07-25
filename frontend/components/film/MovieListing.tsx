import { FilterSidebar } from '@/components/film/FilterSidebar';
import { MovieCard } from '@/components/film/MovieCard';
import { Badge } from '@/components/ui/Badge';
import { Container } from '@/components/layout/Container';
import { Pagination } from '@/components/ui/Pagination';
import {
  countryOptions,
  genreChips,
  movieGrid,
  pagination,
  sortOptions,
} from '@/app/(public)/_mock/moviecategory-data';

/**
 * MovieListing — nội dung trang danh sách phim, khớp design/moviecategory.html. Dùng chung cho
 * cả 3 route /phim-le, /phim-bo, /the-loai/[slug] (chỉ khác `title`/`description` truyền vào) —
 * tránh lặp lại cấu trúc trang 3 lần. Toàn bộ dữ liệu là mock (`_mock/moviecategory-data.ts`),
 * KHÔNG gọi API, không state (đúng phạm vi đã xác nhận ở Phase 10.3).
 */
export function MovieListing({ title, description }: { title: string; description: string }) {
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
          <div className="relative w-full md:w-96">
            <span
              className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-on-surface-variant"
              aria-hidden="true"
            >
              search
            </span>
            <input
              type="text"
              placeholder="Tìm kiếm phim, diễn viên..."
              readOnly
              className="w-full bg-surface-container border-none py-md pl-14 pr-md rounded-full text-body-md shadow-lg placeholder:text-on-surface-variant/50"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-md pb-xl">
          {movieGrid.map((movie) => (
            <MovieCard
              key={movie.id}
              title={movie.title}
              imageSrc={movie.imageSrc}
              rating={movie.rating}
              genreLine={movie.genreLine}
              showActions
              cornerBadge={
                movie.badge ? (
                  <Badge variant="primary" className="border-none">
                    {movie.badge}
                  </Badge>
                ) : undefined
              }
            />
          ))}
        </div>

        <Pagination
          currentPage={pagination.currentPage}
          pages={pagination.pages}
          lastPage={pagination.lastPage}
        />
      </section>
    </Container>
  );
}
