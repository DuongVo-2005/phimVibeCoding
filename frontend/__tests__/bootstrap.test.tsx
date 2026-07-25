import { render, screen } from '@testing-library/react';
import HomePage from '../app/(public)/page';

// Test xác nhận pipeline bootstrap (TypeScript + SWC transform + React Testing Library + jsdom)
// hoạt động đúng — không phải test nghiệp vụ. Cập nhật ở Phase 10.2: trang chủ không còn là
// placeholder text (đã thay bằng UI thật theo design/homepage.html), nên đổi sang assert tiêu đề
// hero — vẫn chỉ xác nhận component render được, không kiểm tra logic nghiệp vụ.
describe('bootstrap smoke test', () => {
  it('renders the home page without throwing', () => {
    render(<HomePage />);
    expect(screen.getByRole('heading', { name: 'Vương Triều Bóng Đêm' })).toBeInTheDocument();
  });
});
