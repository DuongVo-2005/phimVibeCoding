'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

// Chỉ wiring QueryClientProvider theo frontend.md §2 (TanStack Query cho server state).
// Chưa có bất kỳ query/mutation hook nghiệp vụ nào ở đây.
export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
