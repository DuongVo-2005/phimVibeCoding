'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { ApiRequestError } from '@/lib/api/client';
import { authApi } from '@/lib/api/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { registerSchema, type RegisterFormValues } from '@/lib/validation/auth';

/**
 * Quyết định B (Phase 11.1): đăng ký xong CHUYỂN SANG `/dang-nhap`, KHÔNG tự đăng nhập — gọi
 * thẳng `authApi.register` (REST thuần, không qua NextAuth `authorize()` vì đó là luồng riêng
 * cho đăng nhập bằng Credentials Provider).
 */
export function RegisterForm() {
  const router = useRouter();
  const { status } = useSession();
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quyết định E (Phase 11.1): chặn user ĐÃ đăng nhập truy cập lại trang này — xử lý phía client
  // (không sửa middleware.ts), giữ nguyên `app/(auth)/layout.tsx` là Server Component đồng bộ.
  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/');
    }
  }, [status, router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (values: RegisterFormValues) => {
    setFormError(null);
    setIsSubmitting(true);

    try {
      await authApi.register(values.email, values.password, values.name || undefined);
      router.push('/dang-nhap');
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
      <h1 className="text-headline-lg font-headline-lg text-on-surface mb-sm">Đăng ký</h1>

      <Input
        label="Tên (tuỳ chọn)"
        type="text"
        autoComplete="name"
        error={errors.name?.message}
        {...register('name')}
      />
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
      <Input
        label="Xác nhận mật khẩu"
        type="password"
        autoComplete="new-password"
        error={errors.confirmPassword?.message}
        {...register('confirmPassword')}
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
        {isSubmitting ? 'Đang đăng ký...' : 'Đăng ký'}
      </Button>

      <p className="text-label-md text-on-surface-variant text-center mt-sm">
        Đã có tài khoản?{' '}
        <Link href="/dang-nhap" className="text-primary hover:underline">
          Đăng nhập
        </Link>
      </p>
    </form>
  );
}
