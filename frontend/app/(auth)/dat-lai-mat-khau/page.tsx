import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';

export const metadata: Metadata = {
  title: 'Đặt lại mật khẩu',
};

// `ResetPasswordForm` dùng `useSearchParams()` (đọc `token`) — cùng lý do bắt buộc <Suspense>
// như `app/(auth)/dang-nhap/page.tsx`.
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
