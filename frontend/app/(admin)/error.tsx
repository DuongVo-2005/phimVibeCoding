'use client';

import { useEffect } from 'react';
import { ErrorState } from '@/components/ui/ErrorState';

/**
 * Next.js route-level error boundary cho `(admin)` — bắt lỗi render/runtime không mong muốn ở BẤT
 * KỲ trang admin nào (Next.js yêu cầu đúng chữ ký `{error, reset}`, phải là Client Component).
 * Tái dùng `ErrorState` có sẵn (nút "Thử lại" gọi `reset()` — Next.js tự re-render lại segment lỗi,
 * khác `refetch()` của React Query dùng ở nơi khác vì đây là lỗi RENDER, không phải lỗi query).
 */
export default function AdminError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-lg">
      <ErrorState message="Có lỗi xảy ra trong khu vực quản trị." onRetry={reset} />
    </div>
  );
}
