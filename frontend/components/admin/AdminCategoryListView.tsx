'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { SkeletonBlock } from '@/components/ui/SkeletonBlock';
import { useNotification } from '@/hooks/useNotification';
import { ApiRequestError } from '@/lib/api/client';
import { useDeleteCategoryMutation } from '@/lib/query/mutations';
import { categoriesQueryOptions } from '@/lib/query/options';
import type { Category } from '@/lib/types/category';
import { AdminTable } from './AdminTable';
import { ConfirmDialog } from './ConfirmDialog';
import { Select } from './Select';

const TABLE_COLUMNS = ['Tên thể loại', 'Slug', 'Trạng thái', 'Hot', 'Thao tác'];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Hoạt động' },
  { value: 'inactive', label: 'Đã ẩn' },
];

/**
 * AdminCategoryListView — Phase 19B.3. `GET /categories` mặc định chỉ trả `isActive=true`
 * (`QueryCategoryDto`, audit Phase 19B.3) — KHÔNG có giá trị "tất cả" trong 1 lần gọi. Gọi 2 lần
 * song song (`isActive=true` + `isActive=false`) rồi gộp lại để trang quản lý thấy được TOÀN BỘ
 * thể loại theo mặc định (không ẩn dữ liệu khỏi admin), lọc "Hoạt động/Đã ẩn" thực hiện client-side
 * trên tập đã gộp. Không phân trang server (API không hỗ trợ — dữ liệu thể loại nhỏ, hiện hết 1
 * lần là hợp lý).
 */
export function AdminCategoryListView() {
  const notify = useNotification();
  const deleteMutation = useDeleteCategoryMutation();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const activeQuery = useQuery(categoriesQueryOptions.list({ isActive: true }));
  const inactiveQuery = useQuery(categoriesQueryOptions.list({ isActive: false }));

  const isLoading = activeQuery.isLoading || inactiveQuery.isLoading;
  const isError = activeQuery.isError || inactiveQuery.isError;
  // Gộp theo `_id` (không nối mảng trực tiếp) — ngay sau khi 1 mutation invalidate cache, 2 query
  // này có thể refetch không đồng bộ, khiến cùng 1 danh mục xuất hiện tạm thời ở CẢ 2 kết quả nếu
  // `isActive` của nó vừa đổi (query chưa refetch xong vẫn còn giữ dữ liệu cũ) — nối trực tiếp gây
  // trùng `key` React (phát hiện qua Manual QA thật, console warning "two children with same key").
  const all = Array.from(
    new Map(
      [...(activeQuery.data ?? []), ...(inactiveQuery.data ?? [])].map((category) => [
        category._id,
        category,
      ]),
    ).values(),
  );

  const filtered = all.filter((category) => {
    if (search && !category.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter === 'active' && !category.isActive) return false;
    if (statusFilter === 'inactive' && category.isActive) return false;
    return true;
  });

  return (
    <div className="flex flex-col gap-lg">
      <div className="flex items-start justify-between gap-md">
        <div>
          <h1 className="text-headline-lg font-headline-lg text-on-surface">Quản lý thể loại</h1>
          <p className="text-body-md text-on-surface-variant">{all.length} thể loại</p>
        </div>
        <Button href="/admin/the-loai/moi" variant="primary" className="shrink-0">
          <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
            add
          </span>
          Thêm thể loại
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-sm">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Tìm theo tên thể loại..."
          aria-label="Tìm theo tên thể loại"
          className="flex-1 bg-surface-container-high border border-transparent rounded-xl py-base px-md text-body-md text-on-surface outline-none focus:ring-2 focus:ring-primary/50 transition-all"
        />
        <div className="w-full sm:w-56">
          <Select
            label="Trạng thái"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            options={STATUS_OPTIONS}
          />
        </div>
      </div>

      {isError ? (
        <ErrorState
          message="Không tải được danh sách thể loại."
          onRetry={() => {
            activeQuery.refetch();
            inactiveQuery.refetch();
          }}
        />
      ) : isLoading ? (
        <div className="flex flex-col gap-sm" aria-hidden="true">
          {Array.from({ length: 5 }).map((_, index) => (
            <SkeletonBlock key={index} className="h-14 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon="category" message="Không tìm thấy thể loại." />
      ) : (
        <>
          <div className="hidden lg:block">
            <AdminTable columns={TABLE_COLUMNS}>
              {filtered.map((category) => (
                <tr key={category._id} className="hover:bg-white/5 transition-colors duration-200">
                  <td className="px-md py-sm font-bold text-on-surface">{category.name}</td>
                  <td className="px-md py-sm text-on-surface-variant">{category.slug}</td>
                  <td className="px-md py-sm text-on-surface-variant">
                    {category.isActive ? 'Hoạt động' : 'Đã ẩn'}
                  </td>
                  <td className="px-md py-sm text-on-surface-variant">
                    {category.isHot ? 'Hot' : '—'}
                  </td>
                  <td className="px-md py-sm">
                    <div className="flex items-center gap-sm">
                      <Link
                        href={`/admin/the-loai/${category.slug}`}
                        className="text-primary hover:underline text-label-md font-bold"
                      >
                        Sửa
                      </Link>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(category)}
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
            {filtered.map((category) => (
              <div
                key={category._id}
                className="flex flex-col gap-1 rounded-xl border border-white/10 bg-surface-container p-md"
              >
                <p className="font-bold text-on-surface">{category.name}</p>
                <p className="text-label-md text-on-surface-variant">
                  {category.slug} • {category.isActive ? 'Hoạt động' : 'Đã ẩn'}
                  {category.isHot ? ' • Hot' : ''}
                </p>
                <div className="flex items-center gap-md mt-1">
                  <Link
                    href={`/admin/the-loai/${category.slug}`}
                    className="text-primary hover:underline text-label-md font-bold"
                  >
                    Sửa
                  </Link>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(category)}
                    className="text-error hover:underline text-label-md font-bold"
                  >
                    Xoá
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Xoá thể loại"
        message={
          deleteTarget
            ? `Xoá vĩnh viễn "${deleteTarget.name}"? Không thể hoàn tác. (Backend sẽ từ chối nếu còn phim đang dùng thể loại này.)`
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
                  error instanceof ApiRequestError ? error.message : 'Xoá thể loại thất bại.',
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
