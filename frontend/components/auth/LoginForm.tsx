'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { signIn, useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useNotification } from '@/hooks/useNotification';
import { loginSchema, type LoginFormValues } from '@/lib/validation/auth';

const SESSION_EXPIRED_MESSAGE = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';

/**
 * Khớp nguyên văn 3 message `authorize()` throw ra ở `app/api/auth/[...nextauth]/route.ts`
 * (`ACCOUNT_DEACTIVATED`/`INVALID_CREDENTIALS`/`UNKNOWN_ERROR`) — dịch sang tiếng Việt hiển thị
 * cho người dùng, không hiện nguyên văn mã lỗi tiếng Anh.
 */
const ERROR_MESSAGES: Record<string, string> = {
  ACCOUNT_DEACTIVATED: 'Tài khoản đã bị vô hiệu hoá.',
  INVALID_CREDENTIALS: 'Email hoặc mật khẩu không đúng.',
  UNKNOWN_ERROR: 'Có lỗi xảy ra, vui lòng thử lại sau.',
};

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  const { status } = useSession();
  const notify = useNotification();

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quyết định E (Phase 11.1): chặn user ĐÃ đăng nhập truy cập lại trang này — xử lý phía client
  // (không sửa middleware.ts), giữ nguyên `app/(auth)/layout.tsx` là Server Component đồng bộ.
  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/');
    }
  }, [status, router]);

  // Phase 17A: `SessionErrorWatcher` (App Root) tự signOut() + điều hướng tới đây kèm
  // `?reason=session-expired` khi refresh token thất bại giữa phiên — hiện thông báo Ở ĐÂY (không
  // phải lúc phát hiện lỗi) để tránh 2 toast chồng nhau trong lúc điều hướng.
  const shownSessionExpiredRef = useRef(false);
  useEffect(() => {
    if (searchParams.get('reason') === 'session-expired' && !shownSessionExpiredRef.current) {
      shownSessionExpiredRef.current = true;
      notify.error(SESSION_EXPIRED_MESSAGE);
    }
  }, [searchParams, notify]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values: LoginFormValues) => {
    setFormError(null);
    setIsSubmitting(true);

    const result = await signIn('credentials', {
      email: values.email,
      password: values.password,
      redirect: false,
    });

    setIsSubmitting(false);

    if (result?.error) {
      setFormError(ERROR_MESSAGES[result.error] ?? ERROR_MESSAGES.UNKNOWN_ERROR);
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex flex-col gap-md bg-surface-container rounded-2xl p-lg"
    >
      <h1 className="text-headline-lg font-headline-lg text-on-surface mb-sm">Đăng nhập</h1>

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
        autoComplete="current-password"
        error={errors.password?.message}
        {...register('password')}
      />

      <Link
        href="/quen-mat-khau"
        className="text-label-md text-primary hover:underline self-end -mt-sm"
      >
        Quên mật khẩu?
      </Link>

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
        {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
      </Button>

      <p className="text-label-md text-on-surface-variant text-center mt-sm">
        Chưa có tài khoản?{' '}
        <Link href="/dang-ky" className="text-primary hover:underline">
          Đăng ký
        </Link>
      </p>
    </form>
  );
}
