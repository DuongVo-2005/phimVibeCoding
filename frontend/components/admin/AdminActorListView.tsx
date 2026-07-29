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
import { useDeleteActorMutation } from '@/lib/query/mutations';
import { actorsQueryOptions } from '@/lib/query/options';
import type { ActorSummary } from '@/lib/types/actor';
import { AdminTable } from './AdminTable';
import { ConfirmDialog } from './ConfirmDialog';

const PAGE_LIMIT = 20;
const TABLE_COLUMNS = ['Tên diễn viên', 'Slug', 'Quốc tịch', 'Thao tác'];

/** AdminActorListView — Phase 19B.5. `GET /actors` CÓ phân trang + `search` (khác
 * `categories`/`countries`, giống `directors`/`films`) — cùng pattern `AdminMovieListView` (debounce
 * search, `pages=[currentPage]` cho `Pagination` — đúng convention mobile-safe đã xác nhận Phase
 * 19B.1). */
export function AdminActorListView() {
  const notify = useNotification();
  const deleteMutation = useDeleteActorMutation();
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<ActorSummary | null>(null);
  const debouncedSearch = useDebouncedValue(searchInput);

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    ...actorsQueryOptions.list({ page, limit: PAGE_LIMIT, search: debouncedSearch || undefined }),
    placeholderData: keepPreviousData,
  });
  const actors = data?.items ?? [];

  return (
    <div className="flex flex-col gap-lg">
      <div className="flex items-start justify-between gap-md">
        <div>
          <h1 className="text-headline-lg font-headline-lg text-on-surface">Quản lý diễn viên</h1>
          <p className="text-body-md text-on-surface-variant">
            {data ? `${data.meta.totalItems.toLocaleString('vi-VN')} diễn viên` : 'Đang tải...'}
          </p>
        </div>
        <Button href="/admin/dien-vien/moi" variant="primary" className="shrink-0">
          <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
            add
          </span>
          Thêm diễn viên
        </Button>
      </div>

      <input
        type="search"
        value={searchInput}
        onChange={(event) => {
          setSearchInput(event.target.value);
          setPage(1);
        }}
        placeholder="Tìm theo tên diễn viên..."
        aria-label="Tìm theo tên diễn viên"
        className="w-full sm:max-w-[28rem] bg-surface-container-high border border-transparent rounded-xl py-base px-md text-body-md text-on-surface outline-none focus:ring-2 focus:ring-primary/50 transition-all"
      />

      {isError ? (
        <ErrorState message="Không tải được danh sách diễn viên." onRetry={() => refetch()} />
      ) : isLoading ? (
        <div className="flex flex-col gap-sm" aria-hidden="true">
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonBlock key={index} className="h-14 rounded-xl" />
          ))}
        </div>
      ) : actors.length === 0 ? (
        <EmptyState icon="person" message="Không tìm thấy diễn viên." />
      ) : (
        <>
          <div className={isFetching ? 'opacity-60 transition-opacity' : ''}>
            <div className="hidden lg:block">
              <AdminTable columns={TABLE_COLUMNS}>
                {actors.map((actor) => (
                  <tr key={actor._id} className="hover:bg-white/5 transition-colors duration-200">
                    <td className="px-md py-sm font-bold text-on-surface">{actor.name}</td>
                    <td className="px-md py-sm text-on-surface-variant">{actor.slug}</td>
                    <td className="px-md py-sm text-on-surface-variant">
                      {actor.nationality || '—'}
                    </td>
                    <td className="px-md py-sm">
                      <div className="flex items-center gap-sm">
                        <Link
                          href={`/admin/dien-vien/${actor.slug}`}
                          className="text-primary hover:underline text-label-md font-bold"
                        >
                          Sửa
                        </Link>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(actor)}
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
              {actors.map((actor) => (
                <div
                  key={actor._id}
                  className="flex flex-col gap-1 rounded-xl border border-white/10 bg-surface-container p-md"
                >
                  <p className="font-bold text-on-surface">{actor.name}</p>
                  <p className="text-label-md text-on-surface-variant">
                    {actor.slug}
                    {actor.nationality ? ` • ${actor.nationality}` : ''}
                  </p>
                  <div className="flex items-center gap-md mt-1">
                    <Link
                      href={`/admin/dien-vien/${actor.slug}`}
                      className="text-primary hover:underline text-label-md font-bold"
                    >
                      Sửa
                    </Link>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(actor)}
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
        title="Xoá diễn viên"
        message={
          deleteTarget
            ? `Xoá vĩnh viễn "${deleteTarget.name}"? Không thể hoàn tác. Backend không kiểm tra phim đang dùng diễn viên này trước khi xoá.`
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
                  error instanceof ApiRequestError ? error.message : 'Xoá diễn viên thất bại.',
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
