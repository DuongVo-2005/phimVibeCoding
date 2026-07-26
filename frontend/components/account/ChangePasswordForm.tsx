'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useNotification } from '@/hooks/useNotification';
import { ApiRequestError } from '@/lib/api/client';
import { usersApi } from '@/lib/api/users';
import { changePasswordSchema, type ChangePasswordFormValues } from '@/lib/validation/auth';

/**
 * ChangePasswordForm — Phase 17A. Dùng nguyên `usersApi.updatePassword()` đã có sẵn (API client
 * hoàn chỉnh từ trước, chưa từng có UI gọi tới — xem audit Phase 17). Cùng pattern
 * `LoginForm`/`RegisterForm` (react-hook-form + zod, gọi API trực tiếp bằng try/catch, KHÔNG qua
 * React Query — không có cache nào cần patch/invalidate cho hành động đổi mật khẩu).
 *
 * Lỗi: hiện inline (khớp quy ước `LoginForm`/`RegisterForm`) — message "Mật khẩu hiện tại không
 * đúng" đã là tiếng Việt sẵn từ backend (`users.service.ts`), không cần bảng dịch riêng như
 * `LoginForm`. Thành công: `notify.success()` (khớp quy ước các mutation khác — Favorite/Rating/
 * Comment) + reset form, không điều hướng đi đâu (ở lại trang).
 */
export function ChangePasswordForm() {
  const { data: session } = useSession();
  const notify = useNotification();
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormValues>({ resolver: zodResolver(changePasswordSchema) });

  const onSubmit = async (values: ChangePasswordFormValues) => {
    const accessToken = session?.accessToken;
    if (!accessToken) {
      setFormError('Yêu cầu đăng nhập để đổi mật khẩu.');
      return;
    }

    setFormError(null);
    setIsSubmitting(true);

    try {
      const result = await usersApi.updatePassword(
        {
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        },
        accessToken,
      );
      notify.success(result.message);
      reset();
    } catch (error) {
      setFormError(
        error instanceof ApiRequestError ? error.message : 'Có lỗi xảy ra, vui lòng thử lại sau.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex flex-col gap-md bg-surface-container rounded-2xl p-lg"
    >
      <Input
        label="Mật khẩu hiện tại"
        type="password"
        autoComplete="current-password"
        error={errors.currentPassword?.message}
        {...register('currentPassword')}
      />
      <Input
        label="Mật khẩu mới"
        type="password"
        autoComplete="new-password"
        error={errors.newPassword?.message}
        {...register('newPassword')}
      />
      <Input
        label="Xác nhận mật khẩu mới"
        type="password"
        autoComplete="new-password"
        error={errors.confirmNewPassword?.message}
        {...register('confirmNewPassword')}
      />

      {formError ? (
        <p role="alert" className="text-label-md text-error">
          {formError}
        </p>
      ) : null}

      <Button
        type="submit"
        variant="primary"
        className="mt-sm w-full justify-center"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Đang lưu...' : 'Đổi mật khẩu'}
      </Button>
    </form>
  );
}
