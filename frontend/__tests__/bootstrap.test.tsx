import { render, screen } from '@testing-library/react';
import HomePage from '../app/(public)/page';

// Test xác nhận pipeline bootstrap (TypeScript + SWC transform + React Testing Library + jsdom)
// hoạt động đúng — không phải test nghiệp vụ.
describe('bootstrap smoke test', () => {
  it('renders the placeholder home page without throwing', () => {
    render(<HomePage />);
    expect(screen.getByText(/Placeholder/i)).toBeInTheDocument();
  });
});
