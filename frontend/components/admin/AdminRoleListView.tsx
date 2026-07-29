'use client';

import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { SkeletonBlock } from '@/components/ui/SkeletonBlock';
import { useNotification } from '@/hooks/useNotification';
import { ApiRequestError } from '@/lib/api/client';
import { useDeleteRoleMutation } from '@/lib/query/mutations';
import { rolesQueryOptions } from '@/lib/query/options';
import type { Role } from '@/lib/types/role';
import { AdminTable } from './AdminTable';
import { ConfirmDialog } from './ConfirmDialog';

const TABLE_COLUMNS = ['Tên role', 'Mô tả', 'Loại', 'Thao tác'];

/**
 * AdminRoleListView — Phase 19B.9. `GET /roles` trả mảng trần (không phân trang — số lượng role
 * trong 1 dự án luôn nhỏ, khác `users`/`films`). Việc gán Permission cho role làm ở trang Sửa
 * (`EditRoleView`) — không lặp lại checklist quyền ở đây.
 *
 * KHÔNG xây trang quản lý "Permissions" riêng: `permissions.controller.ts` có đủ CRUD nhưng
 * Permission là danh mục cố định khớp trực tiếp các `@RequirePermission()` decorator thật trong
 * code (`seed-rbac.ts`) — tạo/xoá permission tuỳ ý qua UI sẽ tạo bản ghi không gate được gì (tạo
 * mới) hoặc phá vỡ guard đang dùng (xoá cái đang gán) mà không có cách nào cảnh báo an toàn từ UI.
 * Danh sách permission chỉ dùng làm checklist READ-ONLY khi gán cho role (`EditRoleView`).
 */
export function AdminRoleListView() {
  const { data: session } = useSession();
  const accessToken = session?.accessToken;
  const notify = useNotification();
  const deleteMutation = useDeleteRoleMutation();
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);

  const {
    data: roles,
    isLoading,
    isError,
    refetch,
  } = useQuery(rolesQueryOptions.list(accessToken));

  return (
    <div className="flex flex-col gap-lg">
      <div className="flex items-start justify-between gap-md">
        <div>
          <h1 className="text-headline-lg font-headline-lg text-on-surface">
            Quản lý Role &amp; Permission
          </h1>
          <p className="text-body-md text-on-surface-variant">
            {roles ? `${roles.length} role` : 'Đang tải...'}
          </p>
        </div>
        <Button href="/admin/vai-tro/moi" variant="primary" className="shrink-0">
          <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
            add
          </span>
          Thêm role
        </Button>
      </div>

      {isError ? (
        <ErrorState message="Không tải được danh sách role." onRetry={() => refetch()} />
      ) : isLoading ? (
        <div className="flex flex-col gap-sm" aria-hidden="true">
          {Array.from({ length: 4 }).map((_, index) => (
            <SkeletonBlock key={index} className="h-14 rounded-xl" />
          ))}
        </div>
      ) : !roles || roles.length === 0 ? (
        <EmptyState icon="admin_panel_settings" message="Chưa có role nào." />
      ) : (
        <>
          <div className="hidden lg:block">
            <AdminTable columns={TABLE_COLUMNS}>
              {roles.map((role) => (
                <tr key={role._id} className="hover:bg-white/5 transition-colors duration-200">
                  <td className="px-md py-sm font-bold text-on-surface">{role.name}</td>
                  <td className="px-md py-sm text-on-surface-variant">{role.description || '—'}</td>
                  <td className="px-md py-sm">
                    {role.isSystem ? (
                      <Badge variant="primary">Hệ thống</Badge>
                    ) : (
                      <Badge>Tuỳ chỉnh</Badge>
                    )}
                  </td>
                  <td className="px-md py-sm">
                    <div className="flex items-center gap-sm">
                      <Link
                        href={`/admin/vai-tro/${role._id}`}
                        className="text-primary hover:underline text-label-md font-bold"
                      >
                        Sửa
                      </Link>
                      <button
                        type="button"
                        disabled={role.isSystem}
                        onClick={() => setDeleteTarget(role)}
                        className="text-error hover:underline text-label-md font-bold disabled:opacity-40 disabled:no-underline"
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
            {roles.map((role) => (
              <div
                key={role._id}
                className="flex flex-col gap-1 rounded-xl border border-white/10 bg-surface-container p-md"
              >
                <div className="flex items-center justify-between gap-sm">
                  <p className="font-bold text-on-surface">{role.name}</p>
                  {role.isSystem ? (
                    <Badge variant="primary">Hệ thống</Badge>
                  ) : (
                    <Badge>Tuỳ chỉnh</Badge>
                  )}
                </div>
                <p className="text-label-md text-on-surface-variant">{role.description || '—'}</p>
                <div className="flex items-center gap-md mt-1">
                  <Link
                    href={`/admin/vai-tro/${role._id}`}
                    className="text-primary hover:underline text-label-md font-bold"
                  >
                    Sửa
                  </Link>
                  <button
                    type="button"
                    disabled={role.isSystem}
                    onClick={() => setDeleteTarget(role)}
                    className="text-error hover:underline text-label-md font-bold disabled:opacity-40 disabled:no-underline"
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
        title="Xoá role"
        message={
          deleteTarget
            ? `Xoá vĩnh viễn role "${deleteTarget.name}"? Không thể hoàn tác. Backend sẽ từ chối nếu còn người dùng đang gán role này.`
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
                notify.success(`Đã xoá role "${deleteTarget.name}".`);
                setDeleteTarget(null);
              },
              onError: (error) => {
                notify.error(
                  error instanceof ApiRequestError ? error.message : 'Xoá role thất bại.',
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
