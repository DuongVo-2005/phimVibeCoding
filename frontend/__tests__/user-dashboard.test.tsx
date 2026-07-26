import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { SessionProvider } from 'next-auth/react';
import { UserDashboardView } from '../components/account/UserDashboardView';

// Quyết định C (Phase 10.8): route /user/profile có auth guard qua middleware.ts, Playwright
// không thể truy cập trực tiếp mà không đăng nhập thật (không tự chế JWT, không bypass
// middleware — xem route-protection.spec.ts cho hành vi redirect). Test này render thẳng
// component (không qua middleware, vì Jest không chạy qua HTTP) để xác nhận UI dựng đúng.
//
// Phase 17A: component giờ gọi `useSession()`/`useQuery(usersQueryOptions.me())` (trước đây 100%
// mock, không hook nào) — cần bọc `SessionProvider`/`QueryClientProvider` để render không throw,
// cùng cách `bootstrap.test.tsx` đã làm. `session={null}` (không có backend thật trong test env,
// đúng triết lý đã chọn ở `bootstrap.test.tsx`: không mock fetch, phần phụ thuộc API tự hiện đúng
// trạng thái của nó) → query bị `enabled: false`, component dừng ở trạng thái loading (skeleton)
// — không còn assert được "Bảo Anh"/tiêu đề Yêu thích-Danh sách xem (chỉ hiện sau khi có dữ liệu
// thật), chỉ xác nhận render không lỗi.
describe('UserDashboardView', () => {
  it('renders without throwing while session is unauthenticated', () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    const { container } = render(
      <SessionProvider session={null}>
        <QueryClientProvider client={queryClient}>
          <UserDashboardView />
        </QueryClientProvider>
      </SessionProvider>,
    );

    expect(container.firstChild).not.toBeNull();
  });
});
