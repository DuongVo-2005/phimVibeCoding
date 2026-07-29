'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { authApi } from '@/lib/api/auth';
import { ApiRequestError } from '@/lib/api/client';
import { forgotPasswordSchema, type ForgotPasswordFormValues } from '@/lib/validation/auth';

/**
 * ForgotPasswordForm — Phase 19B.11. Gọi thẳng `authApi.forgotPassword` (REST thuần, cùng pattern
 * `RegisterForm` — không qua NextAuth vì không phải luồng đăng nhập). Backend LUÔN trả cùng 1
 * message chung dù email có tồn tại hay không (chống dò email — `auth.service.ts`'s
 * `forgotPassword()`) — hiện nguyên message đó, không tự suy diễn "đã gửi" hay "không tìm thấy".
 *
 * LƯU Ý đã audit: backend hiện CHƯA tích hợp gửi email thật (SMTP/SES) — token reset chỉ log ở
 * server (dev-only), không có cách nào người dùng thật nhận được token qua UI này. Đây là giới hạn
 * backend có sẵn (TODO trong `auth.service.ts`), không phải lỗi của form — form vẫn đúng hợp đồng
 * API, chỉ chưa "đóng vòng" được tới hộp thư thật.
 */
export function ForgotPasswordForm() {
  const [submitted, setSubmitted] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({ resolver: zodResolver(forgotPasswordSchema) });

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    setFormError(null);
    setIsSubmitting(true);

    try {
      const result = await authApi.forgotPassword(values.email);
      setResultMessage(result.message);
      setSubmitted(true);
    } catch (error) {
      setFormError(
        error instanceof ApiRequestError ? error.message : 'Có lỗi xảy ra, vui lòng thử lại sau.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col gap-md bg-surface-container rounded-2xl p-lg text-center">
        <span
          className="material-symbols-outlined text-primary text-[40px] mx-auto"
          aria-hidden="true"
        >
          mark_email_read
        </span>
        <p className="text-body-md text-on-surface">{resultMessage}</p>
        <Link href="/dang-nhap" className="text-primary hover:underline text-label-md">
          Về trang đăng nhập
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
      <h1 className="text-headline-lg font-headline-lg text-on-surface mb-sm">Quên mật khẩu</h1>
      <p className="text-label-md text-on-surface-variant -mt-sm">
        Nhập email đã đăng ký, chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu.
      </p>

      <Input
        label="Email"
        type="email"
        autoComplete="email"
        error={errors.email?.message}
        {...register('email')}
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
        {isSubmitting ? 'Đang gửi...' : 'Gửi hướng dẫn'}
      </Button>

      <p className="text-label-md text-on-surface-variant text-center mt-sm">
        <Link href="/dang-nhap" className="text-primary hover:underline">
          Quay lại đăng nhập
        </Link>
      </p>
    </form>
  );
}
