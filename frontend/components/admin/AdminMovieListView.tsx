'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Pagination } from '@/components/ui/Pagination';
import { SkeletonBlock } from '@/components/ui/SkeletonBlock';
import { useNotification } from '@/hooks/useNotification';
import { ApiRequestError } from '@/lib/api/client';
import { useDeleteFilmMutation } from '@/lib/query/mutations';
import { filmsQueryOptions } from '@/lib/query/options';
import type { FilmSummary } from '@/lib/types/film';
import { AdminTable } from './AdminTable';
import { ConfirmDialog } from './ConfirmDialog';
import { EMPTY_MOVIE_FILTER, FilterBar, type MovieFilterValues } from './FilterBar';
import { MovieListCard } from './MovieListCard';
import { MovieTableRow } from './MovieTableRow';
import { Select } from './Select';

const PAGE_LIMIT = 20;
const DEBOUNCE_MS = 400;

const TABLE_COLUMNS = [
  'Poster',
  'Tên phim',
  'Loại phim',
  'Trạng thái',
  'Năm',
  'Quốc gia',
  'Thể loại',
  'Rating',
  'Lượt xem',
  'Ngày tạo',
  'Thao tác',
];

/** value = `${sortBy}:${sortOrder}` — `QueryFilmDto`/`films.service.ts` nhận `sortBy` là field bất
 * kỳ (không whitelist cố định phía backend), FE chỉ hiện các lựa chọn có ý nghĩa quản trị thay vì
 * lộ toàn bộ field thô. */
const SORT_OPTIONS = [
  { value: 'createdAt:desc', label: 'Mới tạo nhất' },
  { value: 'createdAt:asc', label: 'Cũ nhất' },
  { value: 'view:desc', label: 'Xem nhiều nhất' },
  { value: 'ratingAvg:desc', label: 'Đánh giá cao nhất' },
  { value: 'releaseYear:desc', label: 'Năm mới nhất' },
  { value: 'releaseYear:asc', label: 'Năm cũ nhất' },
  { value: 'title:asc', label: 'Tên A-Z' },
  { value: 'title:desc', label: 'Tên Z-A' },
];
const DEFAULT_SORT = SORT_OPTIONS[0].value;

/**
 * AdminMovieListView — nội dung trang Quản lý phim (Phase 19B.1: CHỈ danh sách — không
 * Create/Edit/Delete/Upload/Episode, đúng phạm vi đã duyệt). Dùng thẳng `filmsQueryOptions.list()`
 * + `filmsApi`/`categoriesApi`/`countriesApi` đã có sẵn (Phase 11.2/11.3A) — không sửa backend,
 * không thêm endpoint, không thêm package.
 *
 * Gọi kèm `accessToken` của admin đang đăng nhập (`useSession`) — `GET /films` là `@Public()` +
 * `OptionalJwtAuthGuard`, nhưng khi có JWT admin hợp lệ backend tự trả CẢ phim ẩn
 * (`isPublished=false`), đúng nhu cầu trang quản lý (xác nhận qua audit Phase 19B:
 * `films.controller.ts`/`films.service.ts`). `enabled: Boolean(accessToken)` — `RoleGuard` ở
 * layout đã đảm bảo tới được trang này là admin thật, nhưng `session` có thể còn `loading` vài
 * mili-giây đầu khi mount.
 *
 * State (search/filter/sort/page) giữ local (`useState`) — không đồng bộ URL: không có tiền lệ
 * URL-sync cho filter ở phần tương tự bên public (`MovieListing` cũng chỉ dùng local state), và
 * trang này không có nơi nào khác điều hướng tới kèm query string cần khôi phục.
 */
export function AdminMovieListView() {
  const { data: session } = useSession();
  const accessToken = session?.accessToken;

  const notify = useNotification();
  const deleteMutation = useDeleteFilmMutation();

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<MovieFilterValues>(EMPTY_MOVIE_FILTER);
  const [sort, setSort] = useState(DEFAULT_SORT);
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<FilmSummary | null>(null);

  // Debounce chạy trong `setTimeout` (bất đồng bộ) — không phải "setState đồng bộ trong effect"
  // (anti-pattern derived-state mà `react-hooks/set-state-in-effect` cảnh báo). Reset `page` về 1
  // ngay tại đây thay vì 1 effect riêng theo dõi `[search]` — tránh đúng anti-pattern đó.
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const [sortBy, sortOrder] = sort.split(':') as [string, 'asc' | 'desc'];

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    ...filmsQueryOptions.list(
      {
        page,
        limit: PAGE_LIMIT,
        sortBy,
        sortOrder,
        search: search || undefined,
        status: filter.status || undefined,
        category: filter.category || undefined,
        country: filter.country || undefined,
        year: filter.year || undefined,
      },
      accessToken,
    ),
    enabled: Boolean(accessToken),
    placeholderData: keepPreviousData,
  });

  const films = data?.items ?? [];

  return (
    <div className="flex flex-col gap-lg">
      <div className="flex items-start justify-between gap-md">
        <div>
          <h1 className="text-headline-lg font-headline-lg text-on-surface">Quản lý phim</h1>
          <p className="text-body-md text-on-surface-variant">
            {data
              ? `${data.meta.totalItems.toLocaleString('vi-VN')} phim`
              : 'Danh sách phim trong hệ thống.'}
          </p>
        </div>
        <Button href="/admin/phim/moi" variant="primary" className="shrink-0">
          <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
            add
          </span>
          Thêm phim
        </Button>
      </div>

      <div className="flex flex-col gap-sm">
        <div className="flex flex-col sm:flex-row gap-sm">
          <div className="relative flex-1">
            <span
              className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-on-surface-variant"
              aria-hidden="true"
            >
              search
            </span>
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Tìm theo tên phim..."
              aria-label="Tìm theo tên phim"
              className="w-full bg-surface-container-high border border-transparent rounded-xl py-base pl-12 pr-md text-body-md text-on-surface outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>
          <div className="w-full sm:w-56">
            <Select
              label="Sắp xếp"
              value={sort}
              onChange={(event) => {
                setSort(event.target.value);
                setPage(1);
              }}
              options={SORT_OPTIONS}
              includeEmptyOption={false}
            />
          </div>
        </div>

        <FilterBar
          value={filter}
          onChange={(next) => {
            setFilter(next);
            setPage(1);
          }}
        />
      </div>

      {isError ? (
        <ErrorState message="Không tải được danh sách phim." onRetry={() => refetch()} />
      ) : isLoading ? (
        <div className="flex flex-col gap-sm" aria-hidden="true">
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonBlock key={index} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : films.length === 0 ? (
        <EmptyState
          icon="movie"
          message="Không tìm thấy phim."
          subtitle="Hãy thử từ khóa hoặc bộ lọc khác."
        />
      ) : (
        <>
          <div className={isFetching ? 'opacity-60 transition-opacity' : ''}>
            <div className="hidden lg:block">
              <AdminTable columns={TABLE_COLUMNS}>
                {films.map((film) => (
                  <MovieTableRow
                    key={film._id}
                    film={film}
                    onDeleteClick={() => setDeleteTarget(film)}
                  />
                ))}
              </AdminTable>
            </div>
            <div className="flex flex-col gap-sm lg:hidden">
              {films.map((film) => (
                <MovieListCard
                  key={film._id}
                  film={film}
                  onDeleteClick={() => setDeleteTarget(film)}
                />
              ))}
            </div>
          </div>

          {data && data.meta.totalPages > 1 ? (
            <Pagination
              currentPage={data.meta.page}
              pages={[data.meta.page]}
              lastPage={data.meta.totalPages}
              onPageChange={setPage}
            />
          ) : null}
        </>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Xoá phim"
        message={
          deleteTarget
            ? `Xoá vĩnh viễn "${deleteTarget.title}"? Hành động này không thể hoàn tác (xoá cứng, không có khôi phục — xem BLOCKER Phase 19B).`
            : ''
        }
        confirmLabel="Xoá"
        isLoading={deleteMutation.isPending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) return;
          deleteMutation.mutate(
            { id: deleteTarget._id },
            {
              onSuccess: () => {
                notify.success(`Đã xoá "${deleteTarget.title}".`);
                setDeleteTarget(null);
              },
              onError: (error) => {
                notify.error(
                  error instanceof ApiRequestError ? error.message : 'Xoá phim thất bại.',
                );
                setDeleteTarget(null);
              },
            },
          );
        }}
      />
    </div>
  );
}
