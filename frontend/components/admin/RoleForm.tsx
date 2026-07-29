'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { roleFormSchema, type RoleFormValues } from '@/lib/validation/role';
import type { CreateRoleInput, Role, UpdateRoleInput } from '@/lib/types/role';

/** RoleForm — form Tên/Mô tả dùng chung Create + Edit role (Phase 19B.9). Role hệ thống
 * (`isSystem`) không cho đổi TÊN (backend chặn — `ConflictException`) nên khoá field tên, vẫn cho
 * sửa mô tả (backend không chặn mô tả). */
export function RoleForm({
  mode,
  initialRole,
  onSubmit,
  isSubmitting,
  submitError,
}: {
  mode: 'create' | 'edit';
  initialRole?: Role;
  onSubmit: (body: CreateRoleInput | UpdateRoleInput) => void;
  isSubmitting: boolean;
  submitError: string | null;
}) {
  const router = useRouter();
  const isSystemRole = initialRole?.isSystem ?? false;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RoleFormValues>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: initialRole
      ? { name: initialRole.name, description: initialRole.description }
      : { name: '', description: '' },
  });

  const submit = (values: RoleFormValues) =>
    onSubmit({ name: values.name.trim(), description: values.description?.trim() || undefined });

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="flex flex-col gap-lg">
      <section className="flex flex-col gap-md rounded-2xl bg-surface-container p-lg">
        <Input
          label="Tên role"
          error={errors.name?.message}
          disabled={isSystemRole}
          {...register('name')}
        />
        {isSystemRole ? (
          <p className="text-label-md text-on-surface-variant">
            Đây là role hệ thống — không thể đổi tên hoặc xoá.
          </p>
        ) : null}
        <Input label="Mô tả" error={errors.description?.message} {...register('description')} />
      </section>

      {submitError ? (
        <p role="alert" className="text-label-md text-error">
          {submitError}
        </p>
      ) : null}

      <div className="flex justify-end gap-sm">
        <Button variant="secondary" type="button" onClick={() => router.push('/admin/vai-tro')}>
          Huỷ
        </Button>
        <Button type="submit" variant="primary" disabled={isSubmitting}>
          {isSubmitting ? 'Đang lưu...' : mode === 'create' ? 'Tạo role' : 'Lưu thay đổi'}
        </Button>
      </div>
    </form>
  );
}
