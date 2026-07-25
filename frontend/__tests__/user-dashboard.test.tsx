import { render, screen } from '@testing-library/react';
import { UserDashboardView } from '../components/account/UserDashboardView';

// Quyết định C (Phase 10.8): route /user/profile có auth guard qua middleware.ts, Playwright
// không thể truy cập trực tiếp mà không đăng nhập thật (không tự chế JWT, không bypass
// middleware — xem route-protection.spec.ts cho hành vi redirect). Test này render thẳng
// component (không qua middleware, vì Jest không chạy qua HTTP) để xác nhận UI dựng đúng.
describe('UserDashboardView', () => {
  it('renders dashboard content without throwing', () => {
    render(<UserDashboardView />);
    expect(screen.getAllByText('Bảo Anh').length).toBeGreaterThan(0);
    expect(screen.getByRole('heading', { name: 'Yêu thích' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Danh sách xem' })).toBeInTheDocument();
  });
});
