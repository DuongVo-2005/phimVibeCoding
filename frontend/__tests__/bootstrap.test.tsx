import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { SessionProvider } from 'next-auth/react';
import HomePage from '../app/(public)/page';

// Test xác nhận pipeline bootstrap (TypeScript + SWC transform + React Testing Library + jsdom)
// hoạt động đúng — không phải test nghiệp vụ.
//
// Phase 11.4A: `ContinueWatchingSection`/`TopRatedSection` dùng `useSession()`/`useQuery()` — cần
// bọc `SessionProvider`/`QueryClientProvider` để render không throw (`retry: false` trên
// QueryClient test-local để tránh network retry/backoff làm chậm test, không liên quan hành vi
// production — `createQueryClient()` thật vẫn `retry: 2`, không đổi).
//
// Phase 11.4: Hero/Trending/Categories cũng đã nối API thật và tự ẩn khi chưa có dữ liệu (không
// mock trong môi trường test, không có backend) — không còn assert được tiêu đề hero cứng
// "Vương Triều Bóng Đêm". Đổi sang assert khối "Gợi ý riêng cho bạn" (vẫn dùng
// `_mock/homepage-data.ts`, không phụ thuộc API/backend) — vẫn chỉ xác nhận component render
// được, không kiểm tra logic nghiệp vụ.
describe('bootstrap smoke test', () => {
  it('renders the home page without throwing', () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(
      <SessionProvider session={null}>
        <QueryClientProvider client={queryClient}>
          <HomePage />
        </QueryClientProvider>
      </SessionProvider>,
    );

    expect(screen.getByRole('heading', { name: 'Gợi ý riêng cho bạn' })).toBeInTheDocument();
  });
});
