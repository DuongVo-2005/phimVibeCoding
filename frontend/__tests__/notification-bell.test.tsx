import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { SessionProvider } from 'next-auth/react';
import { NotificationBell } from '../components/layout/NotificationBell';
import { NotificationProvider } from '../components/providers/notification-provider';

// Cùng triết lý `user-dashboard.test.tsx` (Phase 17A): KHÔNG mock fetch, không có backend thật
// trong môi trường test — `session={null}` khiến query `enabled:false`, chỉ xác nhận render/
// tương tác cơ bản không lỗi (không assert được nội dung dropdown thật, cần backend).
describe('NotificationBell', () => {
  const renderBell = () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return render(
      <SessionProvider session={null}>
        <NotificationProvider>
          <QueryClientProvider client={queryClient}>
            <NotificationBell />
          </QueryClientProvider>
        </NotificationProvider>
      </SessionProvider>,
    );
  };

  it('renders without throwing while session is unauthenticated', () => {
    const { container } = renderBell();
    expect(container.firstChild).not.toBeNull();
  });

  it('chưa đăng nhập -> KHÔNG hiện badge số chưa đọc', () => {
    renderBell();
    expect(screen.queryByText(/^\d+$/)).not.toBeInTheDocument();
  });

  it('chưa đăng nhập, bấm chuông -> KHÔNG mở dropdown (không có session để fetch)', () => {
    renderBell();
    fireEvent.click(screen.getByRole('button', { name: 'Thông báo' }));
    expect(screen.queryByText('Xem tất cả')).not.toBeInTheDocument();
  });
});
