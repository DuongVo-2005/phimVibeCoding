'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';
import { createQueryClient } from '@/lib/query/client';

// Chỉ wiring QueryClientProvider theo frontend.md §2 (TanStack Query cho server state).
// Chưa có bất kỳ query/mutation hook nghiệp vụ nào ở đây.
//
// Phase 11.3A (quyết định 2 + 5): dùng createQueryClient() (defaultOptions thật, xem
// lib/query/client.ts) thay vì `new QueryClient()` trần; Devtools chỉ mount khi
// NODE_ENV === 'development' — không lọt vào bundle production.
export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => createQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
