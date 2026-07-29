'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { authApi } from '@/lib/api/auth';
import { ApiRequestError } from '@/lib/api/client';
import { resetPasswordSchema, type ResetPasswordFormValues } from '@/lib/validation/auth';

/**
 * ResetPasswordForm — Phase 19B.11. Đọc `token` từ query string (`?token=...`, link admin/hệ
 * thống gửi tới người dùng qua email trong tương lai — xem ghi chú giới hạn SMTP ở
 * `ForgotPasswordForm.tsx`). Không có `token` trong URL → hiện thẳng lỗi, không render form (token
 * rỗng gửi lên chắc chắn bị backend từ chối 401 "Token không hợp lệ hoặc đã hết hạn").
 */
export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({ resolver: zodResolver(resetPasswordSchema) });

  const onSubmit = async (values: ResetPasswordFormValues) => {
    if (!token) return;
    setFormError(null);
    setIsSubmitting(true);

    try {
      await authApi.resetPassword(token, values.newPassword);
      router.push('/dang-nhap');
    } catch (error) {
      setFormError(
        error instanceof ApiRequestError ? error.message : 'Có lỗi xảy ra, vui lòng thử lại sau.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="flex flex-col gap-md bg-surface-container rounded-2xl p-lg text-center">
        <span
          className="material-symbols-outlined text-error text-[40px] mx-auto"
          aria-hidden="true"
        >
          error
        </span>
        <p className="text-body-md text-on-surface">
          Đường dẫn đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.
        </p>
        <Link href="/quen-mat-khau" className="text-primary hover:underline text-label-md">
          Gửi lại yêu cầu
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex flex-col gap-md bg-surface-container rounded-2xl p-lg"
    >
      <h1 className="text-headline-lg font-headline-lg text-on-surface mb-sm">Đặt lại mật khẩu</h1>

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
        {isSubmitting ? 'Đang lưu...' : 'Đặt lại mật khẩu'}
      </Button>
    </form>
  );
}
