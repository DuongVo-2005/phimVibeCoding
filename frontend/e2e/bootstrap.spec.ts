import { expect, test } from '@playwright/test';

// Smoke test xác nhận hạ tầng (build + server + routing) hoạt động — không phải test nghiệp vụ.
// Cập nhật Phase 10.2: route "/" không còn là placeholder (đã có UI thật, xem
// public-layout.spec.ts) — đổi sang route khác vẫn còn placeholder để giữ đúng mục đích ban đầu
// của test này (xác nhận pipeline route/build hoạt động, không liên quan nội dung trang chủ).
test('trang placeholder (public) tải được', async ({ page }) => {
  await page.goto('/phim-le');
  await expect(page.getByText(/Placeholder/i)).toBeVisible();
});
