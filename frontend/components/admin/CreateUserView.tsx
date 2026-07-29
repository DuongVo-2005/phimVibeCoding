'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useNotification } from '@/hooks/useNotification';
import { ApiRequestError } from '@/lib/api/client';
import { useCreateUserMutation } from '@/lib/query/mutations';
import {
  createUserByAdminSchema,
  type CreateUserByAdminFormValues,
} from '@/lib/validation/admin-user';

/**
 * CreateUserView — Phase 19B.8. `roleIds` KHÔNG có trong form (mặc định role "user" phía backend
 * — xem `CreateUserByAdminDto`, ghi chú `lib/types/user.ts`) — sau khi tạo, đổi role qua danh sách
 * (`PATCH /users/:id/role`) nếu cần cấp quyền admin.
 */
export function CreateUserView() {
  const router = useRouter();
  const notify = useNotification();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const createMutation = useCreateUserMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateUserByAdminFormValues>({ resolver: zodResolver(createUserByAdminSchema) });

  const onSubmit = (values: CreateUserByAdminFormValues) => {
    setSubmitError(null);
    createMutation.mutate(
      { email: values.email, password: values.password, name: values.name?.trim() || undefined },
      {
        onSuccess: () => {
          notify.success('Đã tạo người dùng thành công.');
          router.push('/admin/nguoi-dung');
        },
        onError: (error) => {
          setSubmitError(
            error instanceof ApiRequestError ? error.message : 'Có lỗi xảy ra, vui lòng thử lại.',
          );
        },
      },
    );
  };

  return (
    <div className="flex flex-col gap-lg max-w-2xl">
      <h1 className="text-headline-lg font-headline-lg text-on-surface">Tạo người dùng mới</h1>
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="flex flex-col gap-md rounded-2xl bg-surface-container p-lg"
      >
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          label="Mật khẩu"
          type="password"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register('password')}
        />
        <Input label="Tên (tuỳ chọn)" error={errors.name?.message} {...register('name')} />

        {submitError ? (
          <p role="alert" className="text-label-md text-error">
            {submitError}
          </p>
        ) : null}

        <div className="flex justify-end gap-sm">
          <Button
            variant="secondary"
            type="button"
            onClick={() => router.push('/admin/nguoi-dung')}
          >
            Huỷ
          </Button>
          <Button type="submit" variant="primary" disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Đang tạo...' : 'Tạo người dùng'}
          </Button>
        </div>
      </form>
    </div>
  );
}
