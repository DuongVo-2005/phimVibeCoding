'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Pagination } from '@/components/ui/Pagination';
import { SkeletonBlock } from '@/components/ui/SkeletonBlock';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useNotification } from '@/hooks/useNotification';
import { ApiRequestError } from '@/lib/api/client';
import { useDeleteDirectorMutation } from '@/lib/query/mutations';
import { directorsQueryOptions } from '@/lib/query/options';
import type { DirectorSummary } from '@/lib/types/director';
import { AdminTable } from './AdminTable';
import { ConfirmDialog } from './ConfirmDialog';

const PAGE_LIMIT = 20;
const TABLE_COLUMNS = ['Tên đạo diễn', 'Slug', 'Quốc tịch', 'Thao tác'];

/** AdminDirectorListView — Phase 19B.6. Cùng cấu trúc `AdminActorListView` (backend
 * `directors.controller.ts` giống hệt `actors.controller.ts`: phân trang + search). */
export function AdminDirectorListView() {
  const notify = useNotification();
  const deleteMutation = useDeleteDirectorMutation();
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<DirectorSummary | null>(null);
  const debouncedSearch = useDebouncedValue(searchInput);

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    ...directorsQueryOptions.list({
      page,
      limit: PAGE_LIMIT,
      search: debouncedSearch || undefined,
    }),
    placeholderData: keepPreviousData,
  });
  const directors = data?.items ?? [];

  return (
    <div className="flex flex-col gap-lg">
      <div className="flex items-start justify-between gap-md">
        <div>
          <h1 className="text-headline-lg font-headline-lg text-on-surface">Quản lý đạo diễn</h1>
          <p className="text-body-md text-on-surface-variant">
            {data ? `${data.meta.totalItems.toLocaleString('vi-VN')} đạo diễn` : 'Đang tải...'}
          </p>
        </div>
        <Button href="/admin/dao-dien/moi" variant="primary" className="shrink-0">
          <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
            add
          </span>
          Thêm đạo diễn
        </Button>
      </div>

      <input
        type="search"
        value={searchInput}
        onChange={(event) => {
          setSearchInput(event.target.value);
          setPage(1);
        }}
        placeholder="Tìm theo tên đạo diễn..."
        aria-label="Tìm theo tên đạo diễn"
        className="w-full sm:max-w-[28rem] bg-surface-container-high border border-transparent rounded-xl py-base px-md text-body-md text-on-surface outline-none focus:ring-2 focus:ring-primary/50 transition-all"
      />

      {isError ? (
        <ErrorState message="Không tải được danh sách đạo diễn." onRetry={() => refetch()} />
      ) : isLoading ? (
        <div className="flex flex-col gap-sm" aria-hidden="true">
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonBlock key={index} className="h-14 rounded-xl" />
          ))}
        </div>
      ) : directors.length === 0 ? (
        <EmptyState icon="movie_filter" message="Không tìm thấy đạo diễn." />
      ) : (
        <>
          <div className={isFetching ? 'opacity-60 transition-opacity' : ''}>
            <div className="hidden lg:block">
              <AdminTable columns={TABLE_COLUMNS}>
                {directors.map((director) => (
                  <tr
                    key={director._id}
                    className="hover:bg-white/5 transition-colors duration-200"
                  >
                    <td className="px-md py-sm font-bold text-on-surface">{director.name}</td>
                    <td className="px-md py-sm text-on-surface-variant">{director.slug}</td>
                    <td className="px-md py-sm text-on-surface-variant">
                      {director.nationality || '—'}
                    </td>
                    <td className="px-md py-sm">
                      <div className="flex items-center gap-sm">
                        <Link
                          href={`/admin/dao-dien/${director.slug}`}
                          className="text-primary hover:underline text-label-md font-bold"
                        >
                          Sửa
                        </Link>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(director)}
                          className="text-error hover:underline text-label-md font-bold"
                        >
                          Xoá
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </AdminTable>
            </div>

            <div className="flex flex-col gap-sm lg:hidden">
              {directors.map((director) => (
                <div
                  key={director._id}
                  className="flex flex-col gap-1 rounded-xl border border-white/10 bg-surface-container p-md"
                >
                  <p className="font-bold text-on-surface">{director.name}</p>
                  <p className="text-label-md text-on-surface-variant">
                    {director.slug}
                    {director.nationality ? ` • ${director.nationality}` : ''}
                  </p>
                  <div className="flex items-center gap-md mt-1">
                    <Link
                      href={`/admin/dao-dien/${director.slug}`}
                      className="text-primary hover:underline text-label-md font-bold"
                    >
                      Sửa
                    </Link>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(director)}
                      className="text-error hover:underline text-label-md font-bold"
                    >
                      Xoá
                    </button>
                  </div>
                </div>
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
        title="Xoá đạo diễn"
        message={
          deleteTarget
            ? `Xoá vĩnh viễn "${deleteTarget.name}"? Không thể hoàn tác. Backend không kiểm tra phim đang dùng đạo diễn này trước khi xoá.`
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
                notify.success(`Đã xoá "${deleteTarget.name}".`);
                setDeleteTarget(null);
              },
              onError: (error) => {
                notify.error(
                  error instanceof ApiRequestError ? error.message : 'Xoá đạo diễn thất bại.',
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
