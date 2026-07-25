import { expect, test } from '@playwright/test';

// Smoke test xác nhận hạ tầng (build + server + routing) hoạt động — không phải test nghiệp vụ.
test('trang placeholder (public) tải được', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText(/Placeholder/i)).toBeVisible();
});
