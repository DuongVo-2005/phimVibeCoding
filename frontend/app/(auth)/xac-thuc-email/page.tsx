import type { Metadata } from 'next';
import { Suspense } from 'react';
import { VerifyEmailStatus } from '@/components/auth/VerifyEmailStatus';

export const metadata: Metadata = {
  title: 'Xác thực email',
};

// `VerifyEmailStatus` dùng `useSearchParams()` (đọc `token`) — cùng lý do bắt buộc <Suspense>
// như `app/(auth)/dat-lai-mat-khau/page.tsx`.
export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailStatus />
    </Suspense>
  );
}
