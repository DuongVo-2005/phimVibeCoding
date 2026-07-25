import { Suspense } from 'react';
import { LoginForm } from '@/components/auth/LoginForm';

// `LoginForm` dùng `useSearchParams()` (đọc `callbackUrl`) — Next.js App Router bắt buộc bọc
// trong <Suspense> cho mọi component gọi `useSearchParams()`, nếu không sẽ lỗi build (CSR bailout
// without a Suspense boundary — xem https://nextjs.org/docs/messages/missing-suspense-with-csr-bailout).
export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
