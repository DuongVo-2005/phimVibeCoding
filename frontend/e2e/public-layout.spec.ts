import { expect, test } from '@playwright/test';

// Xác nhận Public Layout Foundation (Header/Navigation/Footer) render đúng — không phải test
// nghiệp vụ, chỉ kiểm tra hạ tầng UI vừa xây ở Phase 10.1.
test.describe('public layout foundation', () => {
  test('trang chủ hiển thị Header (logo RoPhim) và Footer', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('link', { name: 'RoPhim' })).toBeVisible();
    await expect(page.getByText('© 2026 RoPhim. Bản quyền thuộc về RoPhim.')).toBeVisible();
  });

  test('nav "Phim Lẻ" điều hướng đúng route đã có', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');

    await page.getByRole('link', { name: 'Phim Lẻ' }).click();
    await expect(page).toHaveURL(/\/phim-le$/);
  });
});
