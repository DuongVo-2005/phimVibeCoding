'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useNotification } from '@/hooks/useNotification';
import { ApiRequestError } from '@/lib/api/client';
import { useCreateRoleMutation } from '@/lib/query/mutations';
import type { CreateRoleInput, UpdateRoleInput } from '@/lib/types/role';
import { RoleForm } from './RoleForm';

export function CreateRoleView() {
  const router = useRouter();
  const notify = useNotification();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const createMutation = useCreateRoleMutation();

  const handleSubmit = (body: CreateRoleInput | UpdateRoleInput) => {
    setSubmitError(null);
    createMutation.mutate(body as CreateRoleInput, {
      onSuccess: (role) => {
        notify.success('Đã tạo role thành công.');
        router.push(`/admin/vai-tro/${role._id}`);
      },
      onError: (error) => {
        setSubmitError(
          error instanceof ApiRequestError ? error.message : 'Có lỗi xảy ra, vui lòng thử lại.',
        );
      },
    });
  };

  return (
    <div className="flex flex-col gap-lg max-w-2xl">
      <h1 className="text-headline-lg font-headline-lg text-on-surface">Tạo role mới</h1>
      <RoleForm
        mode="create"
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending}
        submitError={submitError}
      />
    </div>
  );
}
