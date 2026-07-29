'use client';

import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { SkeletonBlock } from '@/components/ui/SkeletonBlock';
import { useNotification } from '@/hooks/useNotification';
import { ApiRequestError } from '@/lib/api/client';
import { useSetRolePermissionsMutation, useUpdateRoleMutation } from '@/lib/query/mutations';
import { permissionsQueryOptions, rolesQueryOptions } from '@/lib/query/options';
import type { CreateRoleInput, UpdateRoleInput } from '@/lib/types/role';
import { RoleForm } from './RoleForm';

function groupByResource<T extends { resource: string }>(items: T[]): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const group = map.get(item.resource) ?? [];
    group.push(item);
    map.set(item.resource, group);
  }
  return map;
}

/**
 * EditRoleView — Phase 19B.9. Tách 2 khối rõ ràng vì backend là 2 endpoint khác nhau:
 * 1. Tên/Mô tả (`RoleForm`, `PATCH /roles/:id`).
 * 2. Checklist Permission theo `resource` (`PUT /roles/:id/permissions` — THAY THẾ toàn bộ tập,
 *    không phải thêm/bớt riêng lẻ — xem `SetRolePermissionsDto` "thay thế toàn bộ tập hiện có").
 * Selection khởi tạo từ `role.permissionKeys` (đã resolve) đối chiếu `_id` thật trong danh sách
 * permission đầy đủ — cần `_id` để gọi `PUT` (DTO nhận `permissionIds`, không nhận `keys`).
 */
export function EditRoleView({ id }: { id: string }) {
  const router = useRouter();
  const { data: session } = useSession();
  const accessToken = session?.accessToken;
  const notify = useNotification();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string> | null>(null);
  // Theo dõi lần fetch permissionKeys ĐÃ dùng để khởi tạo `selectedIds` — tránh gọi lại
  // `setSelectedIds` mỗi render (react-hooks: "Avoid calling setState() directly within an
  // effect" — đây là pattern React khuyến nghị thay effect: so sánh trực tiếp trong render, chỉ
  // setState khi giá trị nguồn THẬT SỰ đổi, không lặp vô hạn vì điều kiện tự tắt sau lần đầu).
  const [seededFromKeys, setSeededFromKeys] = useState<string[] | null>(null);

  const updateMutation = useUpdateRoleMutation();
  const permissionsMutation = useSetRolePermissionsMutation();

  const roleQuery = useQuery(rolesQueryOptions.detail(id, accessToken));
  const permissionsQuery = useQuery(permissionsQueryOptions.list(accessToken));

  if (roleQuery.data && permissionsQuery.data && seededFromKeys !== roleQuery.data.permissionKeys) {
    const ids = permissionsQuery.data
      .filter((permission) => roleQuery.data.permissionKeys.includes(permission.key))
      .map((permission) => permission._id);
    setSeededFromKeys(roleQuery.data.permissionKeys);
    setSelectedIds(new Set(ids));
  }

  const handleSubmit = (body: CreateRoleInput | UpdateRoleInput) => {
    setSubmitError(null);
    updateMutation.mutate(
      { id, body: body as UpdateRoleInput },
      {
        onSuccess: () => notify.success('Đã lưu thay đổi.'),
        onError: (error) => {
          setSubmitError(
            error instanceof ApiRequestError ? error.message : 'Có lỗi xảy ra, vui lòng thử lại.',
          );
        },
      },
    );
  };

  const togglePermission = (permissionId: string) => {
    setSelectedIds((current) => {
      const next = new Set(current ?? []);
      if (next.has(permissionId)) {
        next.delete(permissionId);
      } else {
        next.add(permissionId);
      }
      return next;
    });
  };

  const savePermissions = () => {
    if (!selectedIds) return;
    permissionsMutation.mutate(
      { id, permissionIds: Array.from(selectedIds) },
      {
        onSuccess: () => notify.success('Đã lưu quyền cho role.'),
        onError: (error) => {
          notify.error(error instanceof ApiRequestError ? error.message : 'Lưu quyền thất bại.');
        },
      },
    );
  };

  if (roleQuery.isLoading || permissionsQuery.isLoading) {
    return (
      <div className="flex flex-col gap-md max-w-2xl" aria-hidden="true">
        <SkeletonBlock className="h-8 w-1/3 rounded" />
        <SkeletonBlock className="h-48 rounded-2xl" />
        <SkeletonBlock className="h-64 rounded-2xl" />
      </div>
    );
  }

  if (roleQuery.isError || permissionsQuery.isError || !roleQuery.data || !permissionsQuery.data) {
    return (
      <ErrorState
        message="Không tải được thông tin role."
        onRetry={() => {
          roleQuery.refetch();
          permissionsQuery.refetch();
        }}
      />
    );
  }

  const grouped = groupByResource(permissionsQuery.data);

  return (
    <div className="flex flex-col gap-lg max-w-2xl">
      <h1 className="text-headline-lg font-headline-lg text-on-surface">
        Sửa role: {roleQuery.data.name}
      </h1>

      <RoleForm
        mode="edit"
        initialRole={roleQuery.data}
        onSubmit={handleSubmit}
        isSubmitting={updateMutation.isPending}
        submitError={submitError}
      />

      <section className="flex flex-col gap-md rounded-2xl bg-surface-container p-lg">
        <h2 className="text-headline-md font-headline-md text-on-surface">Quyền (Permission)</h2>
        <p className="text-label-md text-on-surface-variant">
          {roleQuery.data.name === 'admin'
            ? 'Role "admin" phải có ít nhất 1 quyền — backend sẽ từ chối nếu bỏ chọn hết.'
            : 'Chọn các quyền được phép cho role này.'}
        </p>

        <div className="flex flex-col gap-lg">
          {Array.from(grouped.entries()).map(([resource, permissions]) => (
            <div key={resource} className="flex flex-col gap-sm">
              <h3 className="text-label-lg font-bold text-on-surface uppercase tracking-wide">
                {resource}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-sm">
                {permissions.map((permission) => (
                  <label
                    key={permission._id}
                    className="flex items-center gap-sm text-body-md text-on-surface cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds?.has(permission._id) ?? false}
                      onChange={() => togglePermission(permission._id)}
                      className="accent-primary"
                    />
                    <span>{permission.key}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-sm mt-sm">
          <Button variant="secondary" type="button" onClick={() => router.push('/admin/vai-tro')}>
            Quay lại
          </Button>
          <Button
            type="button"
            variant="primary"
            disabled={permissionsMutation.isPending}
            onClick={savePermissions}
          >
            {permissionsMutation.isPending ? 'Đang lưu...' : 'Lưu quyền'}
          </Button>
        </div>
      </section>
    </div>
  );
}
