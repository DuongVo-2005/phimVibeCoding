import { apiBaseUrl } from '@/lib/api/client';

// Guard-test cho quy ước đã xác nhận ở Phase 9.1: NEXT_PUBLIC_API_URL KHÔNG kèm /api/v1,
// client tự thêm prefix.
describe('apiBaseUrl', () => {
  it('ghép NEXT_PUBLIC_API_URL với prefix /api/v1', () => {
    expect(apiBaseUrl.endsWith('/api/v1')).toBe(true);
  });
});
