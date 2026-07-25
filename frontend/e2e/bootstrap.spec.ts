import { expect, test } from '@playwright/test';

// Smoke test xác nhận hạ tầng (build + server + routing) hoạt động — không phải test nghiệp vụ.
// Cập nhật Phase 10.6: route "/dien-vien" không còn là placeholder (đã có UI thật, xem
// actor-directory.spec.ts) — đổi sang route khác vẫn còn placeholder để giữ đúng mục đích ban đầu
// của test này (xác nhận pipeline route/build hoạt động, không liên quan nội dung trang cụ thể).
test('trang placeholder (public) tải được', async ({ page }) => {
  await page.goto('/dien-vien/lee-min-ho');
  await expect(page.getByText(/Placeholder/i)).toBeVisible();
});
