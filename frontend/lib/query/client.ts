import { QueryClient } from '@tanstack/react-query';
import { DEFAULT_MUTATION_OPTIONS, DEFAULT_QUERY_OPTIONS } from './defaults';

/**
 * Phase 11.3A (quyết định 2): thay `new QueryClient()` trần (Phase 8.2 — không có
 * `defaultOptions` nào) bằng `createQueryClient()` có cấu hình thật. Vẫn dùng đúng pattern
 * `useState(() => createQueryClient())` ở `QueryProvider` (Client Component) — hàm này chỉ đóng
 * gói cấu hình, không tự giữ instance singleton (mỗi lần gọi tạo 1 `QueryClient` mới, đúng yêu
 * cầu 1 instance ổn định/mount của React Query cho App Router).
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: DEFAULT_QUERY_OPTIONS,
      mutations: DEFAULT_MUTATION_OPTIONS,
    },
  });
}
