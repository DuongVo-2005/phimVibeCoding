'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Pagination } from '@/components/ui/Pagination';
import { SkeletonBlock } from '@/components/ui/SkeletonBlock';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useNotification } from '@/hooks/useNotification';
import { ApiRequestError } from '@/lib/api/client';
import {
  useDeleteUserMutation,
  useUpdateUserRoleMutation,
  useUpdateUserStatusMutation,
} from '@/lib/query/mutations';
import { usersQueryOptions } from '@/lib/query/options';
import type { AppUserRole, UserProfile } from '@/lib/types/user';
import { AdminTable } from './AdminTable';
import { ConfirmDialog } from './ConfirmDialog';
import { Select } from './Select';

const PAGE_LIMIT = 20;
const TABLE_COLUMNS = ['Tên', 'Email', 'Role', 'Trạng thái', 'Ngày tạo', 'Thao tác'];

const ROLE_OPTIONS = [
  { value: 'user', label: 'User' },
  { value: 'admin', label: 'Admin' },
];

const STATUS_FILTER_OPTIONS = [
  { value: 'true', label: 'Hoạt động' },
  { value: 'false', label: 'Đã khoá' },
];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('vi-VN');
}

/**
 * AdminUserListView — Phase 19B.8. `GET /users` (search/role/isActive/phân trang),
 * `PATCH /users/:id/role`, `PATCH /users/:id/status`, `DELETE /users/:id` đều đã audit đầy đủ.
 * Role/trạng thái sửa TRỰC TIẾP tại dòng (select/button) — chỉ 2 field vô hướng, không cần trang
 * Edit riêng như Category/Country/Actor/Director (những module đó có nhiều field hơn, cần form).
 *
 * Tự khoá thao tác Role/Trạng thái/Xoá ở DÒNG CỦA CHÍNH ADMIN ĐANG ĐĂNG NHẬP (so `session.user.id`)
 * — backend đã chặn (`ensureNotSelf()`, `ConflictException`) nhưng UI tự vô hiệu hoá trước để tránh
 * round-trip lỗi, KHÔNG thay thế guard backend (defense-in-depth).
 *
 * Không có trang "Sửa" riêng cho `roleIds` (RBAC chi tiết, khác `role` enum đơn giản) — thuộc phạm
 * vi phase Role/Permission Management kế tiếp, xem `GET/PUT /users/:id/roles`.
 */
export function AdminUserListView() {
  const { data: session } = useSession();
  const accessToken = session?.accessToken;
  const currentUserId = session?.user?.id;
  const notify = useNotification();
  const roleMutation = useUpdateUserRoleMutation();
  const statusMutation = useUpdateUserStatusMutation();
  const deleteMutation = useDeleteUserMutation();

  const [searchInput, setSearchInput] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<UserProfile | null>(null);
  const debouncedSearch = useDebouncedValue(searchInput);

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    ...usersQueryOptions.list(
      {
        page,
        limit: PAGE_LIMIT,
        search: debouncedSearch || undefined,
        role: (roleFilter || undefined) as AppUserRole | undefined,
        isActive: statusFilter ? statusFilter === 'true' : undefined,
      },
      accessToken,
    ),
    placeholderData: keepPreviousData,
  });
  const users = data?.items ?? [];

  return (
    <div className="flex flex-col gap-lg">
      <div className="flex items-start justify-between gap-md">
        <div>
          <h1 className="text-headline-lg font-headline-lg text-on-surface">Quản lý người dùng</h1>
          <p className="text-body-md text-on-surface-variant">
            {data ? `${data.meta.totalItems.toLocaleString('vi-VN')} người dùng` : 'Đang tải...'}
          </p>
        </div>
        <Button href="/admin/nguoi-dung/moi" variant="primary" className="shrink-0">
          <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
            add
          </span>
          Thêm người dùng
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-sm">
        <input
          type="search"
          value={searchInput}
          onChange={(event) => {
            setSearchInput(event.target.value);
            setPage(1);
          }}
          placeholder="Tìm theo tên hoặc email..."
          aria-label="Tìm theo tên hoặc email"
          className="flex-1 bg-surface-container-high border border-transparent rounded-xl py-base px-md text-body-md text-on-surface outline-none focus:ring-2 focus:ring-primary/50 transition-all"
        />
        <div className="w-full sm:w-48">
          <Select
            label="Role"
            value={roleFilter}
            onChange={(event) => {
              setRoleFilter(event.target.value);
              setPage(1);
            }}
            options={ROLE_OPTIONS}
          />
        </div>
        <div className="w-full sm:w-48">
          <Select
            label="Trạng thái"
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value);
              setPage(1);
            }}
            options={STATUS_FILTER_OPTIONS}
          />
        </div>
      </div>

      {isError ? (
        <ErrorState message="Không tải được danh sách người dùng." onRetry={() => refetch()} />
      ) : isLoading ? (
        <div className="flex flex-col gap-sm" aria-hidden="true">
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonBlock key={index} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <EmptyState icon="group" message="Không tìm thấy người dùng." />
      ) : (
        <>
          <div className={isFetching ? 'opacity-60 transition-opacity' : ''}>
            <div className="hidden lg:block">
              <AdminTable columns={TABLE_COLUMNS}>
                {users.map((targetUser) => {
                  const isSelf = targetUser._id === currentUserId;
                  return (
                    <tr
                      key={targetUser._id}
                      className="hover:bg-white/5 transition-colors duration-200"
                    >
                      <td className="px-md py-sm font-bold text-on-surface whitespace-nowrap">
                        {targetUser.name || '—'}
                        {isSelf ? (
                          <span className="ml-xs text-label-md text-primary">(Bạn)</span>
                        ) : null}
                      </td>
                      <td className="px-md py-sm text-on-surface-variant whitespace-nowrap">
                        {targetUser.email}
                      </td>
                      <td className="px-md py-sm">
                        <select
                          value={targetUser.role}
                          disabled={isSelf || roleMutation.isPending}
                          onChange={(event) =>
                            roleMutation.mutate(
                              { id: targetUser._id, role: event.target.value as AppUserRole },
                              {
                                onSuccess: () => notify.success('Đã cập nhật role.'),
                                onError: (error) =>
                                  notify.error(
                                    error instanceof ApiRequestError
                                      ? error.message
                                      : 'Cập nhật role thất bại.',
                                  ),
                              },
                            )
                          }
                          className="bg-surface-container-high border border-transparent rounded-lg px-sm py-1 text-body-md text-on-surface disabled:opacity-40"
                        >
                          {ROLE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-md py-sm whitespace-nowrap text-on-surface-variant">
                        {targetUser.isActive ? 'Hoạt động' : 'Đã khoá'}
                      </td>
                      <td className="px-md py-sm whitespace-nowrap text-on-surface-variant">
                        {formatDate(targetUser.createdAt)}
                      </td>
                      <td className="px-md py-sm">
                        <div className="flex items-center gap-sm">
                          <button
                            type="button"
                            disabled={isSelf || statusMutation.isPending}
                            onClick={() =>
                              statusMutation.mutate(
                                { id: targetUser._id, isActive: !targetUser.isActive },
                                {
                                  onSuccess: () =>
                                    notify.success(
                                      targetUser.isActive
                                        ? 'Đã khoá tài khoản.'
                                        : 'Đã mở khoá tài khoản.',
                                    ),
                                  onError: (error) =>
                                    notify.error(
                                      error instanceof ApiRequestError
                                        ? error.message
                                        : 'Thao tác thất bại.',
                                    ),
                                },
                              )
                            }
                            className="text-primary hover:underline text-label-md font-bold whitespace-nowrap disabled:opacity-40 disabled:no-underline"
                          >
                            {targetUser.isActive ? 'Khoá' : 'Mở khoá'}
                          </button>
                          <button
                            type="button"
                            disabled={isSelf}
                            onClick={() => setDeleteTarget(targetUser)}
                            className="text-error hover:underline text-label-md font-bold disabled:opacity-40 disabled:no-underline"
                          >
                            Xoá
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </AdminTable>
            </div>

            <div className="flex flex-col gap-sm lg:hidden">
              {users.map((targetUser) => {
                const isSelf = targetUser._id === currentUserId;
                return (
                  <div
                    key={targetUser._id}
                    className="flex flex-col gap-1 rounded-xl border border-white/10 bg-surface-container p-md"
                  >
                    <p className="font-bold text-on-surface">
                      {targetUser.name || '—'}
                      {isSelf ? (
                        <span className="ml-xs text-label-md text-primary">(Bạn)</span>
                      ) : null}
                    </p>
                    <p className="text-label-md text-on-surface-variant">{targetUser.email}</p>
                    <p className="text-label-md text-on-surface-variant">
                      {ROLE_OPTIONS.find((o) => o.value === targetUser.role)?.label} •{' '}
                      {targetUser.isActive ? 'Hoạt động' : 'Đã khoá'} •{' '}
                      {formatDate(targetUser.createdAt)}
                    </p>
                    <div className="flex items-center gap-md mt-1">
                      <button
                        type="button"
                        disabled={isSelf || statusMutation.isPending}
                        onClick={() =>
                          statusMutation.mutate(
                            { id: targetUser._id, isActive: !targetUser.isActive },
                            {
                              onSuccess: () =>
                                notify.success(
                                  targetUser.isActive
                                    ? 'Đã khoá tài khoản.'
                                    : 'Đã mở khoá tài khoản.',
                                ),
                              onError: (error) =>
                                notify.error(
                                  error instanceof ApiRequestError
                                    ? error.message
                                    : 'Thao tác thất bại.',
                                ),
                            },
                          )
                        }
                        className="text-primary hover:underline text-label-md font-bold disabled:opacity-40 disabled:no-underline"
                      >
                        {targetUser.isActive ? 'Khoá' : 'Mở khoá'}
                      </button>
                      <button
                        type="button"
                        disabled={isSelf}
                        onClick={() => setDeleteTarget(targetUser)}
                        className="text-error hover:underline text-label-md font-bold disabled:opacity-40 disabled:no-underline"
                      >
                        Xoá
                      </button>
                    </div>
                  </div>
                );
              })}
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
        title="Xoá người dùng"
        message={
          deleteTarget ? `Xoá vĩnh viễn tài khoản "${deleteTarget.email}"? Không thể hoàn tác.` : ''
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
                notify.success(`Đã xoá "${deleteTarget.email}".`);
                setDeleteTarget(null);
              },
              onError: (error) => {
                notify.error(
                  error instanceof ApiRequestError ? error.message : 'Xoá người dùng thất bại.',
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
